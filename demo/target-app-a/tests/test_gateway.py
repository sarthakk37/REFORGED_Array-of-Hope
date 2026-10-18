"""Unit tests for payment-gateway verifying business rules and drift resilience."""

import json
import os
import sys
from pathlib import Path
from typing import Any

import pytest

# Ensure target app directory is on sys.path
APP_DIR = str(Path(__file__).resolve().parent.parent)
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

from payment_gateway.models import PaymentRecord
from service import parse_payment_event, process_payment


def load_payload(mode: str | None = None) -> dict[str, Any]:
    """Load JSON payload for specified mode or active DRIFT_MODE environment variable."""
    selected_mode = mode or os.environ.get("DRIFT_MODE", "v1")
    fixture_file = (
        Path(__file__).resolve().parent.parent
        / "fixtures"
        / "payloads"
        / f"{selected_mode}.json"
    )
    with open(fixture_file, encoding="utf-8") as f:
        return json.load(f)


def test_process_active_payload() -> None:
    """Verify parsing against active DRIFT_MODE payload returns valid PaymentRecord."""
    payload = load_payload()
    record = parse_payment_event(payload)
    assert isinstance(record, PaymentRecord)
    assert record.event_id == "pay_9F2kL1"
    assert record.amount_paise == 49900
    assert record.customer_email == "asha@example.com"
    assert record.is_paid is True


def test_business_rule_amount_is_integer_paise() -> None:
    """Business rule: amount is stored as int paise in amount_paise (never float)."""
    payload = load_payload()
    record = parse_payment_event(payload)
    assert isinstance(record.amount_paise, int)
    assert not isinstance(record.amount_paise, float)
    assert record.amount_paise == 49900


def test_business_rule_customer_email_lowercase() -> None:
    """Business rule: customer email is normalized to lowercase in customer_email."""
    payload = load_payload()
    record = parse_payment_event(payload)
    assert record.customer_email == record.customer_email.lower()
    assert "@" in record.customer_email
    assert record.customer_email == "asha@example.com"


def test_business_rule_status_captured_marked_paid() -> None:
    """Business rule: status must be 'captured' to be marked paid."""
    payload = load_payload()
    record = parse_payment_event(payload)
    assert record.status == "captured"
    assert record.is_paid is True


def test_process_payment_dictionary_output() -> None:
    """Verify dictionary output shape matches contract expected by sandbox verifier."""
    payload = load_payload()
    result = process_payment(payload)
    assert result["amount_in_cents"] == 49900
    assert result["amount_paise"] == 49900
    assert result["customer_email"] == "asha@example.com"
    assert "status" in result


@pytest.mark.parametrize("drift_scenario", ["rename", "type", "nested"])
def test_parsed_record_equivalence_across_versions(drift_scenario: str) -> None:
    """Verify that after a fix, drifting payloads produce identical records to baseline v1."""
    active_mode = os.environ.get("DRIFT_MODE", "v1")
    if active_mode != "v1" and active_mode != drift_scenario:
        pytest.skip(
            f"Skipping {drift_scenario} test under active DRIFT_MODE={active_mode}"
        )

    # Baseline record from v1
    v1_record = parse_payment_event(load_payload("v1"))

    # Drifting record for active mode
    test_mode = "v1" if active_mode == "v1" else drift_scenario
    drift_record = parse_payment_event(load_payload(test_mode))

    assert drift_record.amount_paise == v1_record.amount_paise
    assert drift_record.customer_email == v1_record.customer_email
    assert drift_record.is_paid == v1_record.is_paid
