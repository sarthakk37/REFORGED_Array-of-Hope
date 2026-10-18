"""Payload definitions for the fake payment provider demo service."""

from typing import Any

PAYLOAD_V1: dict[str, Any] = {
    "id": "pay_9F2kL1",
    "event": "payment.captured",
    "currency": "INR",
    "status": "captured",
    "amount_in_cents": 49900,
    "created_at": "2026-10-18T10:15:00Z",
    "customer": {
        "name": "Asha Verma",
        "email": "asha@example.com",
    },
}

PAYLOAD_RENAME: dict[str, Any] = {
    "id": "pay_9F2kL1",
    "event": "payment.captured",
    "currency": "INR",
    "status": "captured",
    "total_amount": 49900,
    "created_at": "2026-10-18T10:15:00Z",
    "customer": {
        "name": "Asha Verma",
        "email": "asha@example.com",
    },
}

PAYLOAD_TYPE: dict[str, Any] = {
    "id": "pay_9F2kL1",
    "event": "payment.captured",
    "currency": "INR",
    "status": "captured",
    "amount": "499.00",
    "created_at": "2026-10-18T10:15:00Z",
    "customer": {
        "name": "Asha Verma",
        "email": "asha@example.com",
    },
}

PAYLOAD_NESTED: dict[str, Any] = {
    "id": "pay_9F2kL1",
    "event": "payment.captured",
    "currency": "INR",
    "status": "captured",
    "amount_in_cents": 49900,
    "created_at": "2026-10-18T10:15:00Z",
    "payer": {
        "contact": {
            "email": "asha@example.com",
        },
    },
}

PAYLOADS: dict[str, dict[str, Any]] = {
    "v1": PAYLOAD_V1,
    "rename": PAYLOAD_RENAME,
    "type": PAYLOAD_TYPE,
    "nested": PAYLOAD_NESTED,
}
