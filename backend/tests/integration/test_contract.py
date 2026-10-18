"""Contract test strictly validating API responses against docs/API_CONTRACT.md schemas."""

import pytest
from fastapi.testclient import TestClient

from driftsmith.config import settings
from driftsmith.db.repositories import (
    pull_requests as pr_repo,
)
from driftsmith.db.repositories import (
    runs as runs_repo,
)
from driftsmith.db.session import SessionLocal
from seeds.seed_demo_users import seed


@pytest.fixture(autouse=True)
def setup_contract_data() -> None:
    seed()


def _login(client: TestClient) -> dict:
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@demo.local", "password": settings.demo_password},
    )
    return resp.json()


def test_auth_contract(client: TestClient) -> None:
    """Validate /auth/login and /auth/me against API contract."""
    data = _login(client)
    assert set(data.keys()) == {"access_token", "token_type", "user"}
    assert data["token_type"] == "bearer"
    assert set(data["user"].keys()) == {"id", "email", "role"}
    assert data["user"]["role"] in ("viewer", "approver", "admin")

    token = data["access_token"]
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert set(me_resp.json().keys()) == {"id", "email", "role"}


def test_health_contract(client: TestClient) -> None:
    """Validate /api/health response fields against contract."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"status", "llm_mode", "auth_enabled", "integrations"}
    assert data["status"] in ("ok", "degraded")
    assert data["llm_mode"] in ("live", "replay", "mock")
    assert isinstance(data["auth_enabled"], bool)
    assert len(data["integrations"]) == 6
    for item in data["integrations"]:
        assert set(item.keys()) == {"name", "status", "detail"}
        assert item["name"] in ("database", "llm", "github", "slack", "sandbox", "n8n")
        assert item["status"] in ("live", "dry_run", "disabled", "down")


def test_runs_and_detail_contract(client: TestClient) -> None:
    """Validate /api/runs and /api/runs/{id} response shape."""
    token = _login(client)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Seed a complete run with report, patch, and PR
    run_id = "run-contract-100"
    with SessionLocal() as db:
        runs_repo.create_run(
            db, run_id, "rename", "Stripe Webhook Listener", source="n8n", external_ref="wf-42"
        )
        runs_repo.update_run(
            db,
            run_id,
            status="awaiting_approval",
            confidence=0.99,
            verified=True,
            healed_from_memory=False,
            llm_calls=3,
            iterations=1,
            finished=True,
        )
        pr_repo.save_pull_request(
            db, run_id, branch="driftsmith/fix-run-100", status="dry_run", dry_run=True
        )

    # 1. Test GET /api/runs
    list_resp = client.get("/api/runs", headers=headers)
    assert list_resp.status_code == 200
    runs = list_resp.json()
    run = next(r for r in runs if r["id"] == run_id)
    expected_run_fields = {
        "id",
        "scenario",
        "service_name",
        "source",
        "external_ref",
        "status",
        "confidence",
        "verified",
        "healed_from_memory",
        "llm_calls",
        "iterations",
        "started_at",
        "finished_at",
    }
    assert set(run.keys()) == expected_run_fields
    assert run["scenario"] in ("rename", "type", "nested")
    assert run["source"] in ("manual", "webhook", "ci", "n8n")
    assert run["status"] in (
        "queued",
        "running",
        "verified",
        "failed",
        "awaiting_approval",
        "approved",
        "rejected",
    )

    # 2. Test GET /api/runs/{id}
    detail_resp = client.get(f"/api/runs/{run_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    expected_detail_fields = expected_run_fields | {"drift_report", "patch", "pull_request"}
    assert set(detail.keys()) == expected_detail_fields


def test_patterns_contract(client: TestClient) -> None:
    """Validate /api/patterns response shape."""
    token = _login(client)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/patterns", headers=headers)
    assert resp.status_code == 200
    patterns = resp.json()
    assert isinstance(patterns, list)
    if patterns:
        expected_pattern_fields = {"id", "fingerprint", "summary", "times_used", "created_at"}
        assert set(patterns[0].keys()) == expected_pattern_fields


def test_error_shape_contract(client: TestClient) -> None:
    """Validate that error responses strictly match { 'detail': string }."""
    resp = client.get("/api/runs/non-existent-run-id-999")
    assert resp.status_code == 401
    assert set(resp.json().keys()) == {"detail"}
    assert isinstance(resp.json()["detail"], str)
