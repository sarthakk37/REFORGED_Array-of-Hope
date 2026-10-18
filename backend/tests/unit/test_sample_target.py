"""Unit tests verifying the sample_target service and fixtures."""

import json
from pathlib import Path

import pytest

from tests.sample_target.service import process_payment


def test_sample_target_baseline_payload() -> None:
    """Verify sample target processes baseline v1 payload."""
    payload_file = Path("tests/sample_target/fixtures/payloads/v1.json")
    with open(payload_file, encoding="utf-8") as f:
        payload = json.load(f)

    result = process_payment(payload)
    assert result["amount_in_cents"] == 49900
    assert result["customer_email"] == "alex@example.com"


def test_sample_target_breaks_on_rename_payload() -> None:
    """Verify sample target breaks on rename scenario before healing."""
    payload_file = Path("tests/sample_target/fixtures/payloads/rename.json")
    with open(payload_file, encoding="utf-8") as f:
        payload = json.load(f)

    with pytest.raises(KeyError) as exc_info:
        process_payment(payload)
    assert "amount_in_cents" in str(exc_info.value)
