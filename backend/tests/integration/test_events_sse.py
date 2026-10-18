"""Integration tests for Server-Sent Events (SSE) streaming endpoint."""

from fastapi.testclient import TestClient

from driftsmith.config import settings
from driftsmith.db.repositories import events as events_repo
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.db.session import SessionLocal, init_db


def test_sse_event_stream(client: TestClient) -> None:
    """Verify SSE endpoint streams data: JSON frames ending on run_finished event."""
    init_db()

    # Authenticate
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "admin@demo.local", "password": settings.demo_password},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create run and finished event in DB
    run_id = "run-sse-test"
    with SessionLocal() as db:
        runs_repo.create_run(db, run_id, "rename", "payment-gateway")
        events_repo.add_event(
            db, run_id, 1, "sentinel", "action", "Drift detected", {"storyStep": 1}
        )
        events_repo.add_event(
            db, run_id, 2, "system", "info", "run_finished", {"status": "completed"}
        )

    # Connect to SSE stream
    with client.stream("GET", f"/api/runs/{run_id}/events", headers=headers) as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        lines = list(response.iter_lines())
        data_lines = [line for line in lines if line.startswith("data:")]
        assert len(data_lines) == 2
        assert "sentinel" in data_lines[0]
        assert "run_finished" in data_lines[1]
