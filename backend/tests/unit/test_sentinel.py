"""Unit tests for Sentinel drift detection across all 3 scenarios."""

import json
from pathlib import Path

from driftsmith.core.sentinel import detect_drift

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "sample_target" / "fixtures" / "payloads"


def _load_payload(filename: str) -> dict:
    with open(FIXTURES_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def test_sentinel_detects_rename() -> None:
    """Verify detection of renamed field amount_in_cents -> total_amount."""
    v1 = _load_payload("v1.json")
    rename = _load_payload("rename.json")

    report = detect_drift("rename", v1, rename)
    assert len(report.changes) >= 1
    ch = report.changes[0]
    assert ch.type == "renamed"
    assert ch.from_ == "amount_in_cents"
    assert ch.to == "total_amount"
    assert ch.confidence >= 0.95
    assert report.fingerprint.startswith("fp_rename_")


def test_sentinel_detects_type_coercion() -> None:
    """Verify detection of type and unit change from paise int to rupee string."""
    v1 = _load_payload("v1.json")
    drift_type = _load_payload("type.json")

    report = detect_drift("type", v1, drift_type)
    assert len(report.changes) >= 1
    ch = report.changes[0]
    assert ch.type == "type_changed"
    assert ch.from_ == "amount_in_cents"
    assert ch.to == "amount"
    assert report.risk == "high"


def test_sentinel_detects_nested_restructuring() -> None:
    """Verify detection of customer.email relocation to payer.contact.email."""
    v1 = _load_payload("v1.json")
    nested = _load_payload("nested.json")

    report = detect_drift("nested", v1, nested)
    assert len(report.changes) >= 1
    ch = report.changes[0]
    assert ch.type == "moved"
    assert ch.from_ == "customer.email"
    assert ch.to == "payer.contact.email"
