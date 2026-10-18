"""Pytest global fixtures and test setup."""

import pytest
from fastapi.testclient import TestClient

import driftsmith.db.models  # noqa: F401
from driftsmith.db.base import Base
from driftsmith.db.session import engine
from driftsmith.main import create_app
from seeds.seed_demo_users import seed


@pytest.fixture(autouse=True)
def clean_database() -> None:
    """Ensure a pristine database schema with seeded demo users before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed()


@pytest.fixture
def client() -> TestClient:
    """Provide a TestClient for testing API routes."""
    app = create_app()
    return TestClient(app)
