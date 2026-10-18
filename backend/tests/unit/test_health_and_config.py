"""Unit tests for configuration and health endpoint."""

from fastapi.testclient import TestClient

from driftsmith.config import Settings


def test_config_defaults() -> None:
    """Verify default configuration values."""
    s = Settings()
    assert s.port == 8000
    assert "http://localhost:5173" in s.cors_origin_list
    assert s.llm_mode in ("live", "replay", "mock")


def test_health_endpoint(client: TestClient) -> None:
    """Verify health endpoint returns contract-compliant response."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "llm_mode" in data
    assert "auth_enabled" in data
    assert isinstance(data["integrations"], list)
    names = [item["name"] for item in data["integrations"]]
    assert "database" in names
    assert "llm" in names
    assert "github" in names
    assert "slack" in names
    assert "sandbox" in names
    assert "n8n" in names


def test_health_aliases(client: TestClient) -> None:
    """Verify /health and /system/health aliases return identical structure."""
    res1 = client.get("/health")
    res2 = client.get("/system/health")
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json()["status"] == res2.json()["status"]
