"""Deterministic fingerprint calculation for schema drift patterns.

Ensures identical drift signatures generate reproducible, stable fingerprints.
"""

import hashlib
from collections.abc import Sequence

from driftsmith.api.schemas import DriftChangeSchema


def generate_drift_fingerprint(
    scenario: str,
    changes: Sequence[DriftChangeSchema],
) -> str:
    """Calculate a stable, deterministic fingerprint string for a set of drift changes."""
    # Sort changes by path and type to guarantee stability
    sorted_changes = sorted(
        changes,
        key=lambda c: (c.path, c.type, str(c.from_), str(c.to)),
    )

    signature_parts = [f"scenario={scenario}"]
    primary_key = "general"

    for change in sorted_changes:
        signature_parts.append(
            f"type={change.type}|path={change.path}|from={change.from_}|to={change.to}"
        )
        if primary_key == "general" and change.path:
            # Use the first meaningful path component in the human-readable prefix
            primary_key = change.path.replace(".", "_")

    raw_signature = ";".join(signature_parts)
    digest = hashlib.sha256(raw_signature.encode("utf-8")).hexdigest()[:8]

    return f"fp_{scenario}_{primary_key}_{digest}"
