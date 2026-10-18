"""Tests for the mock payment provider demo endpoints."""

import pytest
from fastapi.testclient import TestClient
from mock_provider.main import _state, app
from mock_provider.payloads import (
    PAYLOAD_NESTED,
    PAYLOAD_RENAME,
    PAYLOAD_TYPE,
    PAYLOAD_V1,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_provider_state():
    """Ensure every test begins with clean baseline v1 mode."""
    _state["mode"] = "v1"
    yield
    _state["mode"] = "v1"


def test_health_check() -> None:
    """Verify health endpoint returns ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_default_payload_is_v1() -> None:
    """Verify default payload returns golden baseline v1 schema."""
    response = client.get("/payload")
    assert response.status_code == 200
    data = response.json()
    assert data["amount_in_cents"] == 49900
    assert data["customer"]["email"] == "asha@example.com"
    assert data == PAYLOAD_V1


def test_admin_state() -> None:
    """Verify admin state inspection endpoint."""
    response = client.get("/admin/state")
    assert response.status_code == 200
    assert response.json() == {"mode": "v1"}


def test_admin_drift_switch_and_fetch() -> None:
    """Verify switching drift modes alters subsequent /payload output."""
    # 1. Switch to rename
    resp_rename = client.post("/admin/drift?mode=rename")
    assert resp_rename.status_code == 200
    assert resp_rename.json() == {"mode": "rename", "previous": "v1"}

    payload_rename = client.get("/payload").json()
    assert "total_amount" in payload_rename
    assert payload_rename["total_amount"] == 49900
    assert "amount_in_cents" not in payload_rename
    assert payload_rename == PAYLOAD_RENAME

    # 2. Switch to type
    resp_type = client.post("/admin/drift?mode=type")
    assert resp_type.status_code == 200
    assert resp_type.json() == {"mode": "type", "previous": "rename"}

    payload_type = client.get("/payload").json()
    assert payload_type["amount"] == "499.00"
    assert payload_type == PAYLOAD_TYPE

    # 3. Switch to nested
    resp_nested = client.post("/admin/drift?mode=nested")
    assert resp_nested.status_code == 200
    assert resp_nested.json() == {"mode": "nested", "previous": "type"}

    payload_nested = client.get("/payload").json()
    assert payload_nested["payer"]["contact"]["email"] == "asha@example.com"
    assert payload_nested == PAYLOAD_NESTED


def test_admin_drift_invalid_mode() -> None:
    """Verify passing an unrecognized mode returns HTTP 400 Bad Request."""
    response = client.post("/admin/drift?mode=unknown_scenario")
    assert response.status_code == 400
    assert "Invalid drift mode" in response.json()["detail"]
