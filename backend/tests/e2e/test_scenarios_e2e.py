"""End-to-end tests executing complete self-healing scenarios on sample_target."""

from fastapi.testclient import TestClient

from driftsmith.config import settings
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.db.session import SessionLocal
from driftsmith.services.pipeline import pipeline


def _get_auth_header(client: TestClient, email: str) -> dict[str, str]:
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": settings.demo_password},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_e2e_rename_scenario(client: TestClient) -> None:
    """E2E: Full heal for rename scenario."""
    headers = _get_auth_header(client, "admin@demo.local")
    run_id = "e2e-rename-01"

    with SessionLocal() as db:
        runs_repo.create_run(db, run_id, "rename", "payment-gateway", source="manual")
        success = pipeline.run(db, run_id, "rename", "payment-gateway")
        assert success is True

    # Inspect via API
    resp = client.get(f"/api/runs/{run_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "awaiting_approval"
    assert data["verified"] is True
    assert data["confidence"] >= 0.95
    assert data["patch"] is not None
    assert "total_amount" in data["patch"]["diff_text"]
    assert len(data["patch"]["test_results"]) == 2
    assert all(t["passed"] for t in data["patch"]["test_results"])


def test_e2e_type_scenario_failing_then_fixed(client: TestClient) -> None:
    """E2E: Full heal for type scenario with naturally failing attempt 1, Critic feedback, and success on attempt 2."""
    headers = _get_auth_header(client, "approver@demo.local")
    run_id = "e2e-type-01"

    with SessionLocal() as db:
        runs_repo.create_run(db, run_id, "type", "payment-gateway", source="manual")
        success = pipeline.run(db, run_id, "type", "payment-gateway")
        assert success is True

    resp = client.get(f"/api/runs/{run_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "awaiting_approval"
    assert data["iterations"] == 2
    assert data["llm_calls"] == 4  # Triage(1) + Coder1(1) + Critic(1) + Coder2(1)
    assert data["verified"] is True
    assert "100" in data["patch"]["diff_text"]

    # Approver approves the run
    approve_resp = client.post(f"/api/runs/{run_id}/approve", headers=headers)
    assert approve_resp.status_code == 200
    approve_data = approve_resp.json()
    assert approve_data["status"] == "approved"
    assert approve_data["pull_request"]["status"] == "open"


def test_e2e_nested_scenario(client: TestClient) -> None:
    """E2E: Full heal for nested restructuring scenario."""
    headers = _get_auth_header(client, "admin@demo.local")
    run_id = "e2e-nested-01"

    with SessionLocal() as db:
        runs_repo.create_run(db, run_id, "nested", "payment-gateway", source="manual")
        success = pipeline.run(db, run_id, "nested", "payment-gateway")
        assert success is True

    resp = client.get(f"/api/runs/{run_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "awaiting_approval"
    assert "payer" in data["patch"]["diff_text"]


def test_e2e_memory_heal_zero_llm_calls(client: TestClient) -> None:
    """E2E: Healing a second service/run with learned pattern uses 0 LLM calls."""
    headers = _get_auth_header(client, "admin@demo.local")

    # 1. First service encounters rename drift and learns pattern
    first_run_id = "e2e-service1-rename"
    with SessionLocal() as db:
        runs_repo.create_run(db, first_run_id, "rename", "payment-gateway")
        pipeline.run(db, first_run_id, "rename", "payment-gateway")

    # 2. Second service encounters identical drift pattern
    second_run_id = "e2e-service2-rename"
    with SessionLocal() as db:
        runs_repo.create_run(db, second_run_id, "rename", "payment-gateway")
        success = pipeline.run(db, second_run_id, "rename", "payment-gateway")
        assert success is True

    resp = client.get(f"/api/runs/{second_run_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "awaiting_approval"
    assert data["healed_from_memory"] is True
    assert data["llm_calls"] == 0
    assert data["verified"] is True
