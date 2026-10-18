"""Target Registry loading and validating demo target services."""

import json
import tomllib
from pathlib import Path
from typing import Any

import httpx
from pydantic import BaseModel

from driftsmith.config import settings


class TargetService(BaseModel):
    """Metadata and paths for a registered demo target service."""

    name: str
    language: str
    root_path: Path
    source_files: list[str]
    test_command: str
    provider_payload_file: str


class TargetRegistry:
    """Discovers, parses, and provides access to demo targets and scenario payloads."""

    def __init__(self, targets_dir: str | None = None) -> None:
        self.targets_dir = Path(targets_dir or settings.demo_targets_path)
        self.sample_fallback = (
            Path(__file__).resolve().parent.parent.parent.parent / "tests" / "sample_target"
        )

    def get_target(self, service_name: str) -> TargetService:
        """Locate target service directory by name or fallback to sample_target."""
        # Check in demo_targets_path first
        if self.targets_dir.exists():
            for child in self.targets_dir.iterdir():
                if child.is_dir() and (child / "service.toml").exists():
                    target = self._parse_toml(child)
                    if target and target.name == service_name:
                        return target

        # Fallback to tests/sample_target
        if (self.sample_fallback / "service.toml").exists():
            target = self._parse_toml(self.sample_fallback)
            if target:
                return target

        raise ValueError(f"Target service '{service_name}' not found")

    def _parse_toml(self, directory: Path) -> TargetService | None:
        """Parse service.toml and enforce security path boundaries."""
        toml_path = directory / "service.toml"
        with open(toml_path, "rb") as f:
            data = tomllib.load(f)

        source_files = data.get("source_files", [])
        # Security: reject path traversal
        for sf in source_files:
            resolved = (directory / sf).resolve()
            if not str(resolved).startswith(str(directory.resolve())):
                raise ValueError(f"Path traversal detected in source_files: {sf}")

        return TargetService(
            name=data.get("name", directory.name),
            language=data.get("language", "python"),
            root_path=directory,
            source_files=source_files,
            test_command=data.get("test_command", "pytest tests"),
            provider_payload_file=data.get("provider_payload_file", "fixtures/payloads/v1.json"),
        )

    def get_baseline_payload(self, target: TargetService) -> dict[str, Any]:
        """Read golden baseline v1 payload from target fixtures."""
        v1_path = target.root_path / "fixtures" / "payloads" / "v1.json"
        with open(v1_path, encoding="utf-8") as f:
            return json.load(f)

    def get_drifting_payload(
        self,
        target: TargetService,
        scenario: str,
        provided_payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Retrieve drifting payload from webhook, live provider, or scenario fixture."""
        if provided_payload:
            return provided_payload

        # Attempt to fetch from mock provider if reachable
        if settings.provider_url:
            try:
                with httpx.Client(timeout=1.0) as client:
                    resp = client.get(f"{settings.provider_url}/payload")
                    if resp.status_code == 200:
                        return resp.json()
            except Exception:
                pass  # Fall back to fixture

        # Fallback to target fixture
        scenario_file = target.root_path / "fixtures" / "payloads" / f"{scenario}.json"
        with open(scenario_file, encoding="utf-8") as f:
            return json.load(f)


target_registry = TargetRegistry()
