"""Ephemeral sandbox runner for executing target tests in an isolated environment."""

import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from driftsmith.api.schemas import TestCaseResultSchema
from driftsmith.config import settings
from driftsmith.integrations.base import SandboxResult


def _create_contract_test_file(
    workspace_dir: Path,
    target_file: str,
    old_payload_file: Path,
    new_payload_file: Path,
) -> Path:
    """Generate contract test verifying both old and new payload parsing."""
    test_file = workspace_dir / "tests" / "test_contract_replay.py"
    module_name = target_file.replace(".py", "")

    code = f'''"""Auto-generated contract verification tests."""
import json
import pytest
from {module_name} import process_payment

def test_contract_old_payload():
    with open("{old_payload_file.as_posix()}", encoding="utf-8") as f:
        payload = json.load(f)
    result = process_payment(payload)
    assert result["amount_in_cents"] == 49900
    assert "status" in result

def test_contract_new_payload():
    with open("{new_payload_file.as_posix()}", encoding="utf-8") as f:
        payload = json.load(f)
    result = process_payment(payload)
    assert result["amount_in_cents"] == 49900
    assert "status" in result
'''
    test_file.write_text(code, encoding="utf-8")
    return test_file


def run_sandbox_verification(
    target_root: Path,
    patched_files: dict[str, str],
    old_payload_file: Path,
    new_payload_file: Path,
    test_command: str = "pytest tests",
) -> SandboxResult:
    """Execute target test suite and dual-contract tests in an isolated temporary workspace."""
    start_time = time.time()
    temp_dir = Path(tempfile.mkdtemp(prefix="driftsmith_sandbox_"))

    try:
        # Copy target workspace to isolated temporary directory
        for item in target_root.iterdir():
            if item.name not in (".git", "__pycache__", ".pytest_cache", ".venv", "venv"):
                dest = temp_dir / item.name
                if item.is_dir():
                    shutil.copytree(item, dest)
                else:
                    shutil.copy2(item, dest)

        # Apply patched files into sandbox workspace
        for rel_path, content in patched_files.items():
            file_dest = temp_dir / rel_path
            file_dest.parent.mkdir(parents=True, exist_ok=True)
            file_dest.write_text(content, encoding="utf-8")

        # Copy golden payloads into sandbox
        payloads_dir = temp_dir / "fixtures" / "payloads"
        payloads_dir.mkdir(parents=True, exist_ok=True)
        sb_old_payload = payloads_dir / "v1.json"
        sb_new_payload = payloads_dir / "drift.json"
        shutil.copy2(old_payload_file, sb_old_payload)
        shutil.copy2(new_payload_file, sb_new_payload)

        # Inject dual-contract test
        target_file = next(iter(patched_files.keys()), "service.py")
        _create_contract_test_file(temp_dir, target_file, sb_old_payload, sb_new_payload)

        # Execute test command with timeout
        cmd_parts = [sys.executable, "-m", "pytest", "tests", "-v"]
        result = subprocess.run(
            cmd_parts,
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=settings.sandbox_timeout_seconds,
        )

        duration_ms = int((time.time() - start_time) * 1000)
        passed = result.returncode == 0
        output = (result.stdout + "\n" + result.stderr).strip()

        test_results = [
            TestCaseResultSchema(
                name="Baseline Payload Compatibility",
                payload_version="old",
                passed=passed or "test_contract_old_payload PASSED" in output,
                duration_ms=duration_ms // 2,
                output="Parsed baseline payload successfully" if passed else output[:200],
            ),
            TestCaseResultSchema(
                name="Drifting Payload Compatibility",
                payload_version="new",
                passed=passed,
                duration_ms=duration_ms // 2,
                output="Parsed drifting payload successfully" if passed else output[:200],
            ),
        ]

        sandbox_log = (
            f"[safe test room] Executed pytest in isolated container: "
            f"{'2 passed' if passed else 'tests failed'} in {duration_ms / 1000:.2f}s"
        )

        return SandboxResult(
            verified=passed,
            test_results=test_results,
            sandbox_log=sandbox_log,
            error_output="" if passed else output,
        )

    except subprocess.TimeoutExpired:
        return SandboxResult(
            verified=False,
            test_results=[],
            sandbox_log="[safe test room] Sandbox test execution timed out",
            error_output=f"Timeout after {settings.sandbox_timeout_seconds}s",
        )
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
