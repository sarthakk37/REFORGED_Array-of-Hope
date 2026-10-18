"""Webhook handler for payment gateway events."""

from typing import Any

from service import parse_payment_event

from payment_gateway.models import PaymentRecord


def handle_webhook_event(payload: dict[str, Any]) -> PaymentRecord:
    """Validate and process incoming webhook event payload."""
    return parse_payment_event(payload)
