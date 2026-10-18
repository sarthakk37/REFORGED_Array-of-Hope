"""Integration tests for authentication routes and role authorization."""

from fastapi.testclient import TestClient

from driftsmith.config import settings
from seeds.seed_demo_users import seed


def test_auth_login_success(client: TestClient) -> None:
    """Verify login succeeds for seeded demo users with correct JWT issued."""
    seed()
    response = client.post(
        "/api/auth/login",
        json={"email": "approver@demo.local", "password": settings.demo_password},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "approver@demo.local"
    assert data["user"]["role"] == "approver"


def test_auth_login_invalid_password(client: TestClient) -> None:
    """Verify login fails with 401 and error shape { detail: string } on invalid credentials."""
    response = client.post(
        "/api/auth/login",
        json={"email": "approver@demo.local", "password": "wrong-password"},
    )
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Invalid email or password"


def test_auth_me_authenticated(client: TestClient) -> None:
    """Verify /api/auth/me returns current user when valid Bearer token provided."""
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "viewer@demo.local", "password": settings.demo_password},
    )
    token = login_resp.json()["access_token"]

    me_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    user = me_resp.json()
    assert user["email"] == "viewer@demo.local"
    assert user["role"] == "viewer"


def test_auth_me_unauthenticated(client: TestClient) -> None:
    """Verify 401 when Authorization header is missing or malformed."""
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
    assert "detail" in resp.json()
