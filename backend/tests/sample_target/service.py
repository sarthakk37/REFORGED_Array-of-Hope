"""Payment gateway event processor service."""

from typing import Any


def process_payment(payload: dict[str, Any]) -> dict[str, Any]:
    """Parse payment event and return normalized payment details."""
    event_id = payload["id"]
    amount = payload["amount_in_cents"]
    email = payload["customer"]["email"]
    return {
        "event_id": event_id,
        "amount_in_cents": int(amount),
        "customer_email": str(email),
        "status": "processed",
    }
