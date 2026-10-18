"""Unit tests for database repositories and persistence operations."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import driftsmith.db.models  # noqa: F401
from driftsmith.api.schemas import (
    DriftChangeSchema,
    DriftReportSchema,
    PatchInfoSchema,
    TestCaseResultSchema,
)
from driftsmith.auth.passwords import hash_password, verify_password
from driftsmith.core.patch_plan import PatchPlan, RenameKeyAction
from driftsmith.db.base import Base
from driftsmith.db.repositories import (
    events as events_repo,
)
from driftsmith.db.repositories import (
    patches as patches_repo,
)
from driftsmith.db.repositories import (
    patterns as patterns_repo,
)
from driftsmith.db.repositories import (
    pull_requests as pr_repo,
)
from driftsmith.db.repositories import (
    runs as runs_repo,
)
from driftsmith.db.repositories import (
    users as users_repo,
)


@pytest.fixture
def db_session() -> Session:
    """Create an isolated in-memory SQLite database for repository tests."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_password_hashing() -> None:
    """Verify bcrypt password hashing and verification."""
    raw = "super-secret-password"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong-password", hashed) is False


def test_user_repository(db_session: Session) -> None:
    """Verify user creation, lookup by email, and role assignment."""
    pw_hash = hash_password("pass123")
    user = users_repo.create_user(db_session, "approver@test.local", pw_hash, "approver")
    assert user.id.startswith("usr-")
    assert user.email == "approver@test.local"
    assert user.role == "approver"

    retrieved = users_repo.get_by_email(db_session, "approver@test.local")
    assert retrieved is not None
    assert retrieved.id == user.id

    schema = users_repo.to_schema(retrieved)
    assert schema.email == "approver@test.local"
    assert schema.role == "approver"


def test_runs_and_events_repository(db_session: Session) -> None:
    """Verify run creation, lifecycle updates, and sequence-ordered events."""
    run = runs_repo.create_run(
        db_session,
        run_id="run-test-01",
        scenario="rename",
        service_name="payment-service",
        source="n8n",
        external_ref="n8n-wf-99",
    )
    assert run.id == "run-test-01"
    assert run.source == "n8n"
    assert run.external_ref == "n8n-wf-99"

    # Add sequence events
    events_repo.add_event(
        db_session,
        run_id="run-test-01",
        seq=1,
        agent="sentinel",
        kind="action",
        message="API change detected",
        payload={"storyStep": 1},
    )
    events_repo.add_event(
        db_session,
        run_id="run-test-01",
        seq=2,
        agent="coder",
        kind="thought",
        message="Generating patch plan",
        payload={"storyStep": 3},
    )

    evts = events_repo.list_events(db_session, "run-test-01")
    assert len(evts) == 2
    assert evts[0].seq == 1
    assert evts[1].seq == 2
    assert evts[0].agent == "sentinel"

    # Update run stats
    updated = runs_repo.update_run(
        db_session,
        run_id="run-test-01",
        status="verified",
        confidence=0.99,
        verified=True,
        llm_calls=2,
        finished=True,
    )
    assert updated is not None
    assert updated.status == "verified"
    assert updated.verified is True
    assert updated.finished_at is not None


def test_patterns_repository_and_memory_usage(db_session: Session) -> None:
    """Verify storing learned patterns and incrementing usage counters."""
    plan = PatchPlan(
        scenario="rename",
        summary="Rename key fix",
        actions=[RenameKeyAction(target_path="amount_in_cents", source_path="total_amount")],
    )
    pat = patterns_repo.save_pattern(
        db_session,
        fingerprint="fp_rename_001",
        summary="Rename total_amount fix",
        plan=plan,
    )
    assert pat.times_used == 0

    lookup = patterns_repo.get_by_fingerprint(db_session, "fp_rename_001")
    assert lookup is not None
    assert lookup.summary == "Rename total_amount fix"

    # Increment usage when applied from memory
    incremented = patterns_repo.increment_usage(db_session, "fp_rename_001", calls_saved=3)
    assert incremented is not None
    assert incremented.times_used == 1
    assert incremented.calls_saved == 3


def test_patches_and_pull_requests(db_session: Session) -> None:
    """Verify persisting drift report, patch artifacts, and PR records."""
    run = runs_repo.create_run(
        db_session,
        run_id="run-pr-test",
        scenario="rename",
        service_name="payment-service",
    )

    # Save drift report
    report = DriftReportSchema(
        fingerprint="fp_rename_001",
        summary="Drift detected",
        changes=[
            DriftChangeSchema(
                type="renamed",
                path="amount",
                from_="amount",
                to="total_amount",
                confidence=0.98,
            )
        ],
        risk="medium",
    )
    patches_repo.save_drift_report(db_session, run.id, report)

    # Save patch info
    patch = PatchInfoSchema(
        diff_text="--- a\n+++ b",
        plan_summary="Rename patch",
        verified=True,
        test_results=[
            TestCaseResultSchema(
                name="compat", payload_version="new", passed=True, duration_ms=40, output=None
            )
        ],
        sandbox_log="2 passed in 0.05s",
    )
    patches_repo.save_patch(db_session, run.id, patch)

    # Save PR
    pr = pr_repo.save_pull_request(
        db_session, run.id, branch="driftsmith/fix-run-pr-test", status="dry_run", dry_run=True
    )
    assert pr.dry_run is True

    # Retrieve full detail schema
    db_session.refresh(run)
    detail = runs_repo.to_detail_schema(run)
    assert detail.drift_report is not None
    assert detail.patch is not None
    assert detail.pull_request is not None
    assert detail.pull_request.branch == "driftsmith/fix-run-pr-test"
