"""Repository for Remediation Run persistence and query operations."""

import json
from datetime import UTC, datetime

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import (
    DriftReportSchema,
    PatchInfoSchema,
    PullRequestInfoSchema,
    RunDetailSchema,
    RunSchema,
    RunSource,
    RunStatus,
    Scenario,
)
from driftsmith.db.models import RunModel


def create_run(
    db: Session,
    run_id: str,
    scenario: Scenario,
    service_name: str,
    source: RunSource = "manual",
    external_ref: str | None = None,
) -> RunModel:
    """Insert a new remediation run into the database."""
    run = RunModel(
        id=run_id,
        scenario=scenario,
        service_name=service_name,
        source=source,
        external_ref=external_ref,
        status="running",
        started_at=datetime.now(UTC),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_run(db: Session, run_id: str) -> RunModel | None:
    """Retrieve run by its unique identifier."""
    stmt = select(RunModel).where(RunModel.id == run_id)
    return db.scalars(stmt).first()


def list_runs(db: Session, limit: int = 50) -> list[RunModel]:
    """Retrieve recent remediation runs sorted descending by started_at."""
    stmt = select(RunModel).order_by(desc(RunModel.started_at)).limit(limit)
    return list(db.scalars(stmt).all())


def update_run(
    db: Session,
    run_id: str,
    status: RunStatus | None = None,
    confidence: float | None = None,
    verified: bool | None = None,
    healed_from_memory: bool | None = None,
    llm_calls: int | None = None,
    iterations: int | None = None,
    finished: bool = False,
) -> RunModel | None:
    """Update execution statistics and lifecycle status for a run."""
    run = get_run(db, run_id)
    if not run:
        return None

    if status is not None:
        run.status = status
    if confidence is not None:
        run.confidence = confidence
    if verified is not None:
        run.verified = verified
    if healed_from_memory is not None:
        run.healed_from_memory = healed_from_memory
    if llm_calls is not None:
        run.llm_calls = llm_calls
    if iterations is not None:
        run.iterations = iterations
    if finished:
        run.finished_at = datetime.now(UTC)

    db.commit()
    db.refresh(run)
    return run


def to_schema(model: RunModel) -> RunSchema:
    """Convert RunModel to basic RunSchema summary."""
    return RunSchema(
        id=model.id,
        scenario=model.scenario,  # type: ignore[arg-type]
        service_name=model.service_name,
        source=model.source,  # type: ignore[arg-type]
        external_ref=model.external_ref,
        status=model.status,  # type: ignore[arg-type]
        confidence=model.confidence,
        verified=model.verified,
        healed_from_memory=model.healed_from_memory,
        llm_calls=model.llm_calls,
        iterations=model.iterations,
        started_at=model.started_at.isoformat(),
        finished_at=model.finished_at.isoformat() if model.finished_at else None,
    )


def to_detail_schema(model: RunModel) -> RunDetailSchema:
    """Convert RunModel to comprehensive RunDetailSchema including diff and report."""
    base = to_schema(model)

    drift_report = None
    if model.drift_report:
        drift_report = DriftReportSchema(
            fingerprint=model.drift_report.fingerprint,
            summary=model.drift_report.summary,
            changes=json.loads(model.drift_report.changes_json),
            risk=model.drift_report.risk,  # type: ignore[arg-type]
        )

    patch = None
    if model.patch:
        patch = PatchInfoSchema(
            diff_text=model.patch.diff_text,
            plan_summary=model.patch.plan_summary,
            verified=model.patch.verified,
            test_results=json.loads(model.patch.test_results_json),
            sandbox_log=model.patch.sandbox_log,
        )

    pr = None
    if model.pull_request:
        pr = PullRequestInfoSchema(
            url=model.pull_request.url,
            branch=model.pull_request.branch,
            status=model.pull_request.status,  # type: ignore[arg-type]
            dry_run=model.pull_request.dry_run,
        )

    return RunDetailSchema(
        **base.model_dump(),
        drift_report=drift_report,
        patch=patch,
        pull_request=pr,
    )
