"""Verification script testing target-app-a and target-app-b against all drift scenarios.

Runs test suites for both demo applications under each DRIFT_MODE (v1, rename, type, nested)
and prints a summary table. Exits non-zero if any outcome deviates from the expected matrix:
  - v1     -> PASS
  - rename -> FAIL
  - type   -> FAIL
  - nested -> FAIL
"""

import os
import subprocess
import sys
from pathlib import Path

DEMO_ROOT = Path(__file__).resolve().parent.parent

APPS = [
    ("payment-gateway (target-app-a)", DEMO_ROOT / "target-app-a"),
    ("billing-worker (target-app-b)", DEMO_ROOT / "target-app-b"),
]

SCENARIOS = [
    ("v1", "PASS"),
    ("rename", "FAIL"),
    ("type", "FAIL"),
    ("nested", "FAIL"),
]


def run_target_test(app_dir: Path, mode: str) -> bool:
    """Execute pytest inside the target app with designated DRIFT_MODE."""
    env = os.environ.copy()
    env["DRIFT_MODE"] = mode

    cmd = [sys.executable, "-m", "pytest", "tests", "-q"]
    proc = subprocess.run(
        cmd,
        cwd=str(app_dir),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode == 0


def main() -> None:
    """Run full verification matrix across apps and drift scenarios."""
    print("=" * 72)
    print(" DriftSmith Demo Target Verification Matrix")
    print("=" * 72)
    header = f"{'Target Application':<30} | {'Mode':<8} | {'Expected':<8} | {'Actual':<8} | {'Status'}"
    print(header)
    print("-" * len(header))

    all_matched = True
    results = []

    for app_name, app_dir in APPS:
        for mode, expected in SCENARIOS:
            passed = run_target_test(app_dir, mode)
            actual = "PASS" if passed else "FAIL"
            matched = actual == expected
            if not matched:
                all_matched = False

            status_str = "MATCH" if matched else "MISMATCH"
            print(
                f"{app_name:<30} | {mode:<8} | {expected:<8} | {actual:<8} | {status_str}"
            )
            results.append((app_name, mode, expected, actual, matched))

    print("=" * 72)
    if all_matched:
        print("ALL SCENARIOS MATCHED: v1 passes, unpatched drifts fail as required.")
        sys.exit(0)
    else:
        print("VERIFICATION FAILED: Observed behavior differed from expected matrix.")
        sys.exit(1)


if __name__ == "__main__":
    main()
