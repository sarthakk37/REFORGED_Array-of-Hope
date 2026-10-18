"""Billing worker background service consuming payment events."""

from typing import Any

from billing_worker.records import BillingRecord


def ingest_billing_event(payload: dict[str, Any]) -> BillingRecord:
    """Ingest payment notification and translate into ledger BillingRecord."""
    tx_id = payload.get("id")
    raw_status = payload.get("status", "captured")

    paise_val = payload["amount_in_cents"]
    email_addr = payload["customer"]["email"]

    amount_paise = int(paise_val)
    normalized_email = str(email_addr).lower()
    is_captured = raw_status == "captured"

    return BillingRecord(
        invoice_id=str(tx_id),
        amount_paise=amount_paise,
        amount_in_cents=amount_paise,
        customer_email=normalized_email,
        status="captured" if is_captured else "failed",
        is_paid=is_captured,
    )


def process_payment(payload: dict[str, Any]) -> dict[str, Any]:
    """Compatibility entrypoint executing event ingestion and returning dictionary."""
    record = ingest_billing_event(payload)
    return {
        "event_id": record.invoice_id,
        "amount_in_cents": record.amount_in_cents,
        "amount_paise": record.amount_paise,
        "customer_email": record.customer_email,
        "status": "processed" if record.is_paid else "failed",
    }
