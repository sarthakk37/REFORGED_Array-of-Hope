"""Unit tests for pipeline orchestration, agent generation, and memory healing."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

import driftsmith.db.models  # noqa: F401
from driftsmith.ai.agents.coder import CoderAgent
from driftsmith.ai.agents.critic import CriticAgent
from driftsmith.ai.agents.triage import TriageAgent
from driftsmith.core.patch_plan import PatchPlan, RenameKeyAction
from driftsmith.core.sentinel import detect_drift
from driftsmith.db.base import Base
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.services.pipeline import pipeline
from driftsmith.services.target_registry import target_registry


@pytest.fixture
def memory_db() -> Session:
    """Create in-memory SQLite database for pipeline tests."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


def test_triage_agent_mock() -> None:
    """Verify Triage agent emits structured diagnosis."""
    agent = TriageAgent()
    target = target_registry.get_target("payment-gateway")
    old_p = target_registry.get_baseline_payload(target)
    new_p = target_registry.get_drifting_payload(target, "rename")
    report = detect_drift("rename", old_p, new_p)

    diagnosis = agent.diagnose("rename", "payment-gateway", report)
    assert diagnosis.confidence >= 0.9
    assert "amount_in_cents" in diagnosis.summary or "total_amount" in diagnosis.summary


def test_coder_agent_mock() -> None:
    """Verify Coder agent outputs valid PatchPlan."""
    agent = CoderAgent()
    target = target_registry.get_target("payment-gateway")
    old_p = target_registry.get_baseline_payload(target)
    new_p = target_registry.get_drifting_payload(target, "rename")
    report = detect_drift("rename", old_p, new_p)

    plan = agent.generate_plan("rename", "service.py", report, [])
    assert plan.scenario == "rename"
    assert len(plan.actions) >= 1


def test_critic_agent_mock() -> None:
    """Verify Critic agent provides actionable remediation guidance."""
    agent = CriticAgent()
    plan = PatchPlan(
        scenario="type",
        summary="Initial unscaled coercion",
        actions=[RenameKeyAction(target_path="amount_in_cents", source_path="amount")],
    )
    feedback = agent.evaluate_failure("type", plan, "AssertionError: 499 != 49900")
    assert feedback.should_retry is True
    assert "100" in feedback.suggested_fix or "paise" in feedback.diagnosis


def test_full_pipeline_heal_and_memory(memory_db: Session) -> None:
    """Verify full heal pipeline executes, and second execution heals from memory."""
    # First execution: learns fix
    run_1 = runs_repo.create_run(
        memory_db,
        run_id="run-pipe-01",
        scenario="rename",
        service_name="payment-gateway",
    )
    success_1 = pipeline.run(
        db=memory_db,
        run_id=run_1.id,
        scenario="rename",
        service_name="payment-gateway",
    )
    assert success_1 is True

    record_1 = runs_repo.get_run(memory_db, "run-pipe-01")
    assert record_1 is not None
    assert record_1.status == "awaiting_approval"
    assert record_1.healed_from_memory is False
    assert record_1.llm_calls > 0
    assert record_1.verified is True

    # Second execution: zero LLM calls, heals from memory
    run_2 = runs_repo.create_run(
        memory_db,
        run_id="run-pipe-02",
        scenario="rename",
        service_name="payment-gateway",
    )
    success_2 = pipeline.run(
        db=memory_db,
        run_id=run_2.id,
        scenario="rename",
        service_name="payment-gateway",
    )
    assert success_2 is True

    record_2 = runs_repo.get_run(memory_db, "run-pipe-02")
    assert record_2 is not None
    assert record_2.status == "awaiting_approval"
    assert record_2.healed_from_memory is True
    assert record_2.llm_calls == 0
