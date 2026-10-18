"""Unit tests for AST locator."""

from driftsmith.core.locator import locate_field_usages

SAMPLE_SOURCE = """
def process_payment(payload: dict) -> dict:
    event_id = payload["id"]
    amount = payload["amount_in_cents"]
    email = payload["customer"]["email"]
    return {"amount": amount, "email": email}
"""


def test_locate_field_usages_finds_keys() -> None:
    """Verify locator finds subscript usages accurately."""
    matches = locate_field_usages(SAMPLE_SOURCE, ["amount_in_cents", "id"])
    assert len(matches) == 2
    keys = {m.key_name for m in matches}
    assert "amount_in_cents" in keys
    assert "id" in keys
    for m in matches:
        assert m.line_number > 0
        assert "payload" in m.context_line


def test_locate_field_usages_empty_on_missing_key() -> None:
    """Verify locator returns empty list when target key is not in source."""
    matches = locate_field_usages(SAMPLE_SOURCE, ["non_existent_field"])
    assert len(matches) == 0
