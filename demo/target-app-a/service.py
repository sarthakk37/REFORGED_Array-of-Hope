"""Payment gateway service handling webhook parsing and record normalization."""

from typing import Any

from payment_gateway.models import PaymentRecord


def parse_payment_event(payload: dict[str, Any]) -> PaymentRecord:
    """Parse incoming webhook payment event into internal PaymentRecord."""
    event_id = payload["id"]
    amount = payload["amount_in_cents"]
    email = payload["customer"]["email"]
    status = payload.get("status", "captured")

    paise = int(amount)
    customer_email = str(email).lower()
    is_paid = status == "captured"

    return PaymentRecord(
        event_id=str(event_id),
        amount_paise=paise,
        amount_in_cents=paise,
        customer_email=customer_email,
        status="captured" if is_paid else "failed",
        is_paid=is_paid,
    )


def process_payment(payload: dict[str, Any]) -> dict[str, Any]:
    """Parse payment event and return normalized dictionary for contract verification."""
    record = parse_payment_event(payload)
    return {
        "event_id": record.event_id,
        "amount_in_cents": record.amount_in_cents,
        "amount_paise": record.amount_paise,
        "customer_email": record.customer_email,
        "status": "processed" if record.is_paid else "failed",
    }
