"""Deterministic drift sentinel comparing baseline and failing API payloads.

Performs schema diffing and structural analysis without network or LLM dependencies.
"""

from typing import Any

from driftsmith.api.schemas import DriftChangeSchema, DriftReportSchema, RiskLevel
from driftsmith.core.fingerprint import generate_drift_fingerprint


def _flatten_payload(data: dict[str, Any], prefix: str = "") -> dict[str, Any]:
    """Flatten a nested dictionary into dot-separated key paths."""
    flattened: dict[str, Any] = {}
    for key, value in data.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            flattened.update(_flatten_payload(value, full_key))
        else:
            flattened[full_key] = value
    return flattened


def detect_drift(
    scenario: str,
    old_payload: dict[str, Any],
    new_payload: dict[str, Any],
) -> DriftReportSchema:
    """Compare baseline payload and drifting payload to produce a deterministic DriftReport."""
    old_flat = _flatten_payload(old_payload)
    new_flat = _flatten_payload(new_payload)

    changes: list[DriftChangeSchema] = []
    risk: RiskLevel = "medium"

    # 1. Check for value-matching moves (nested or relocated keys)
    for old_path, old_val in old_flat.items():
        if old_path not in new_flat:
            # Check if value exists elsewhere in new payload
            matched_new_path = None
            for new_path, new_val in new_flat.items():
                if old_val == new_val and new_path not in old_flat:
                    matched_new_path = new_path
                    break

            if matched_new_path:
                is_nested = "." in matched_new_path or "." in old_path
                change_type = "moved" if is_nested else "renamed"
                changes.append(
                    DriftChangeSchema(
                        type=change_type,
                        path=old_path,
                        from_=old_path,
                        to=matched_new_path,
                        confidence=0.98,
                    )
                )

    # 2. Check for numeric type conversions / currency rescaling (e.g. 49900 paise vs "499.00" rupees)
    if not changes:
        for old_path, old_val in old_flat.items():
            if old_path not in new_flat:
                # Look for matching amount fields with type changes
                for new_path, new_val in new_flat.items():
                    if ("amount" in old_path or "amount" in new_path) and new_path not in old_flat:
                        # Test if float conversion matches paise / rupees (scale 100)
                        try:
                            float_val = float(new_val)
                            if int(round(float_val * 100)) == int(old_val) or float_val == float(
                                old_val
                            ):
                                changes.append(
                                    DriftChangeSchema(
                                        type="type_changed",
                                        path=old_path,
                                        from_=old_path,
                                        to=new_path,
                                        confidence=0.96,
                                    )
                                )
                                risk = "high"
                                break
                        except (ValueError, TypeError):
                            pass

    # 3. Fallback generic diff if no specific heuristic fired
    if not changes:
        missing_keys = set(old_flat.keys()) - set(new_flat.keys())
        added_keys = set(new_flat.keys()) - set(old_flat.keys())
        for m_key in missing_keys:
            to_key = next(iter(added_keys), None)
            changes.append(
                DriftChangeSchema(
                    type="renamed" if to_key else "removed",
                    path=m_key,
                    from_=m_key,
                    to=to_key,
                    confidence=0.85,
                )
            )

    # Human-readable summary
    if changes:
        primary = changes[0]
        if primary.type == "renamed":
            summary = f"Provider renamed '{primary.from_}' to '{primary.to}'."
        elif primary.type == "type_changed":
            summary = (
                f"Provider changed type of '{primary.from_}' to '{primary.to}' (rescaled currency)."
            )
        elif primary.type == "moved":
            summary = f"Provider relocated '{primary.from_}' to '{primary.to}'."
        else:
            summary = f"Detected schema change on '{primary.path}'."
    else:
        summary = "No significant drift detected between payloads."

    fingerprint = generate_drift_fingerprint(scenario, changes)

    return DriftReportSchema(
        fingerprint=fingerprint,
        summary=summary,
        changes=changes,
        risk=risk,
    )
