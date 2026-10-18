"""Unit tests for deterministic fingerprint calculation."""

from driftsmith.api.schemas import DriftChangeSchema
from driftsmith.core.fingerprint import generate_drift_fingerprint


def test_fingerprint_stability() -> None:
    """Verify identical changes yield the exact same fingerprint regardless of input order."""
    c1 = DriftChangeSchema(
        type="renamed",
        path="amount_in_cents",
        from_="amount_in_cents",
        to="total_amount",
        confidence=0.98,
    )
    c2 = DriftChangeSchema(
        type="moved",
        path="customer.email",
        from_="customer.email",
        to="payer.contact.email",
        confidence=0.95,
    )

    fp1 = generate_drift_fingerprint("rename", [c1, c2])
    fp2 = generate_drift_fingerprint("rename", [c2, c1])

    assert fp1 == fp2
    assert fp1.startswith("fp_rename_")


def test_fingerprint_differs_for_different_scenarios() -> None:
    """Verify different scenarios or changes produce distinct fingerprints."""
    c = DriftChangeSchema(
        type="renamed",
        path="amount",
        from_="amount",
        to="total_amount",
        confidence=0.9,
    )
    fp_rename = generate_drift_fingerprint("rename", [c])
    fp_type = generate_drift_fingerprint("type", [c])
    assert fp_rename != fp_type
