"""Tests for sample payment processing service."""

import json
import sys
from pathlib import Path

# Ensure target service root is on sys.path
service_dir = str(Path(__file__).resolve().parent.parent)
if service_dir not in sys.path:
    sys.path.insert(0, service_dir)

from service import process_payment  # noqa: E402


def test_process_payment_v1() -> None:
    """Test payment processing against the baseline v1 payload."""
    payload_file = Path(__file__).parent.parent / "fixtures" / "payloads" / "v1.json"
    with open(payload_file, encoding="utf-8") as f:
        payload = json.load(f)

    result = process_payment(payload)
    assert result["event_id"] == "evt_1001"
    assert result["amount_in_cents"] == 49900
    assert result["customer_email"] == "alex@example.com"
    assert result["status"] == "processed"
