"""Domain models for target-app-a payment gateway."""

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class PaymentRecord:
    """Normalized domain record representing a captured payment."""

    event_id: str
    amount_paise: int
    amount_in_cents: int
    customer_email: str
    status: str
    is_paid: bool

    def __getitem__(self, item: str) -> Any:
        """Support subscription access for dictionary backwards-compatibility."""
        return getattr(self, item)
