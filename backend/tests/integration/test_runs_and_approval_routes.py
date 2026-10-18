"""Integration tests for runs, approval RBAC, and CORS."""

from fastapi.testclient import TestClient

from driftsmith.config import settings
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.db.session import SessionLocal


def _get_token(client: TestClient, email: str) -> str:
    resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": settings.demo_password},
    )
    return resp.json()["access_token"]


def test_cors_preflight(client: TestClient) -> None:
    """Verify CORS preflight OPTIONS request returns configured origin headers."""
    response = client.options(
        "/api/runs",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_list_runs_and_get_detail(client: TestClient) -> None:
    """Verify listing runs and getting detailed run payload."""
    token = _get_token(client, "admin@demo.local")
    headers = {"Authorization": f"Bearer {token}"}

    # Create dummy run in DB
    with SessionLocal() as db:
        runs_repo.create_run(
            db,
            run_id="run-int-01",
            scenario="rename",
            service_name="payment-gateway",
            source="manual",
        )

    # List runs
    list_resp = client.get("/api/runs", headers=headers)
    assert list_resp.status_code == 200
    runs = list_resp.json()
    assert any(r["id"] == "run-int-01" for r in runs)

    # Detail
    detail_resp = client.get("/api/runs/run-int-01", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == "run-int-01"
    assert detail["service_name"] == "payment-gateway"


def test_viewer_cannot_approve_runs(client: TestClient) -> None:
    """RBAC test: Verify that viewer role is forbidden from approving runs (HTTP 403)."""
    # Create an awaiting_approval run
    with SessionLocal() as db:
        runs_repo.create_run(
            db,
            run_id="run-rbac-01",
            scenario="rename",
            service_name="payment-gateway",
        )
        runs_repo.update_run(db, "run-rbac-01", status="awaiting_approval")

    # Viewer token
    viewer_token = _get_token(client, "viewer@demo.local")
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}

    # Attempt approve as viewer
    resp = client.post("/api/runs/run-rbac-01/approve", headers=viewer_headers)
    assert resp.status_code == 403
    data = resp.json()
    assert "detail" in data
    assert "viewer" in data["detail"].lower() or "forbidden" in data["detail"].lower()


def test_approver_can_approve_runs(client: TestClient) -> None:
    """RBAC test: Verify that approver role can approve awaiting_approval runs."""
    with SessionLocal() as db:
        runs_repo.create_run(
            db,
            run_id="run-rbac-02",
            scenario="rename",
            service_name="payment-gateway",
        )
        runs_repo.update_run(db, "run-rbac-02", status="awaiting_approval")

    approver_token = _get_token(client, "approver@demo.local")
    approver_headers = {"Authorization": f"Bearer {approver_token}"}

    resp = client.post("/api/runs/run-rbac-02/approve", headers=approver_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "approved"
    assert "pull_request" in data
