"""Unit tests for AST patcher verifying dual-payload backward compatibility."""

import json
from pathlib import Path

from driftsmith.core.patch_plan import (
    CoerceTypeAction,
    PatchPlan,
    RemapPathAction,
    RenameKeyAction,
)
from driftsmith.core.patcher import apply_patch_plan

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "sample_target" / "fixtures" / "payloads"
SERVICE_FILE = Path(__file__).resolve().parent.parent / "sample_target" / "service.py"


def _load_payload(filename: str) -> dict:
    with open(FIXTURES_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def _load_source() -> str:
    with open(SERVICE_FILE, encoding="utf-8") as f:
        return f.read()


def test_patcher_rename_backward_compatibility() -> None:
    """Verify rename patch handles both old and new payload formats."""
    source = _load_source()
    plan = PatchPlan(
        scenario="rename",
        summary="Normalize total_amount to amount_in_cents",
        actions=[
            RenameKeyAction(target_path="amount_in_cents", source_path="total_amount"),
        ],
    )

    patched_code, diff = apply_patch_plan(source, plan)
    assert "--- a/service.py" in diff
    assert "+++ b/service.py" in diff

    # Execute patched code in isolated namespace
    namespace: dict = {}
    exec(patched_code, namespace)
    process_func = namespace["process_payment"]

    # Verify old payload works
    old_res = process_func(_load_payload("v1.json"))
    assert old_res["amount_in_cents"] == 49900

    # Verify new payload works
    new_res = process_func(_load_payload("rename.json"))
    assert new_res["amount_in_cents"] == 49900


def test_patcher_type_coercion_backward_compatibility() -> None:
    """Verify type coercion patch rescales rupee string to paise integer for both payloads."""
    source = _load_source()
    plan = PatchPlan(
        scenario="type",
        summary="Coerce rupee string to paise integer",
        actions=[
            CoerceTypeAction(
                target_path="amount_in_cents",
                source_path="amount",
                target_type="int",
                scale_factor=100.0,
            ),
        ],
    )

    patched_code, _ = apply_patch_plan(source, plan)
    namespace: dict = {}
    exec(patched_code, namespace)
    process_func = namespace["process_payment"]

    # Old payload: 49900 paise
    old_res = process_func(_load_payload("v1.json"))
    assert old_res["amount_in_cents"] == 49900

    # New payload: "499.00" rupees -> 49900 paise
    new_res = process_func(_load_payload("type.json"))
    assert new_res["amount_in_cents"] == 49900


def test_patcher_nested_backward_compatibility() -> None:
    """Verify nested remapping handles customer.email and payer.contact.email."""
    source = _load_source()
    plan = PatchPlan(
        scenario="nested",
        summary="Remap payer.contact.email to customer.email",
        actions=[
            RemapPathAction(
                target_path="customer.email",
                source_path="payer.contact.email",
            ),
        ],
    )

    patched_code, _ = apply_patch_plan(source, plan)
    namespace: dict = {}
    exec(patched_code, namespace)
    process_func = namespace["process_payment"]

    # Old payload
    old_res = process_func(_load_payload("v1.json"))
    assert old_res["customer_email"] == "alex@example.com"

    # New payload
    new_res = process_func(_load_payload("nested.json"))
    assert new_res["customer_email"] == "alex@example.com"
