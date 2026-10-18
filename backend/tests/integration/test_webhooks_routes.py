"""Integration tests for webhook incident ingestion routes."""

from fastapi.testclient import TestClient

from driftsmith.config import settings


def test_webhook_missing_key_forbidden(client: TestClient) -> None:
    """Verify webhook rejects request with 403 when no API key is provided."""
    payload = {
        "service_name": "payment-gateway",
        "scenario": "rename",
        "source": "webhook",
    }
    resp = client.post("/api/webhooks/incident", json=payload)
    assert resp.status_code == 403
    assert resp.json()["detail"] == "Invalid or missing webhook signature"


def test_webhook_invalid_key_forbidden(client: TestClient) -> None:
    """Verify webhook rejects request with 403 when wrong API key is provided."""
    payload = {
        "service_name": "payment-gateway",
        "scenario": "rename",
        "source": "n8n",
    }
    resp = client.post(
        "/api/webhooks/incident",
        json=payload,
        headers={"X-API-Key": "wrong-secret-key"},
    )
    assert resp.status_code == 403


def test_webhook_valid_x_api_key_accepted(client: TestClient) -> None:
    """Verify webhook accepts payload with 202 Accepted when valid X-API-Key provided."""
    payload = {
        "service_name": "payment-gateway",
        "scenario": "rename",
        "source": "n8n",
        "external_ref": "n8n-wf-101",
    }
    resp = client.post(
        "/api/webhooks/incident",
        json=payload,
        headers={"X-API-Key": settings.api_key},
    )
    assert resp.status_code == 202
    data = resp.json()
    assert "run_id" in data
    assert data["run_id"].startswith("run-")


def test_webhook_valid_x_driftsmith_key_accepted(client: TestClient) -> None:
    """Verify webhook accepts payload when header is X-DriftSmith-Key."""
    payload = {
        "service_name": "payment-gateway",
        "scenario": "type",
        "source": "webhook",
    }
    resp = client.post(
        "/api/v1/webhooks/drift",
        json=payload,
        headers={"X-DriftSmith-Key": settings.api_key},
    )
    assert resp.status_code == 202
    assert "run_id" in resp.json()
