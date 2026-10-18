"""Pytest global fixtures and test setup."""

import pytest
from fastapi.testclient import TestClient

from driftsmith.main import create_app


@pytest.fixture
def client() -> TestClient:
    """Provide a TestClient for testing API routes."""
    app = create_app()
    return TestClient(app)
