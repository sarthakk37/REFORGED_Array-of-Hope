"""Repository for saving DriftReports and Patch artifacts."""

import json
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import DriftReportSchema, PatchInfoSchema
from driftsmith.db.models import DriftReportModel, PatchModel


def save_drift_report(
    db: Session,
    run_id: str,
    report: DriftReportSchema,
) -> DriftReportModel:
    """Persist or update the drift diagnosis report for a run."""
    stmt = select(DriftReportModel).where(DriftReportModel.run_id == run_id)
    existing = db.scalars(stmt).first()
    changes_json = json.dumps([c.model_dump() for c in report.changes])

    if existing:
        existing.fingerprint = report.fingerprint
        existing.summary = report.summary
        existing.changes_json = changes_json
        existing.risk = report.risk
        db.commit()
        db.refresh(existing)
        return existing

    record = DriftReportModel(
        id=f"rep-{uuid.uuid4().hex[:8]}",
        run_id=run_id,
        fingerprint=report.fingerprint,
        summary=report.summary,
        changes_json=changes_json,
        risk=report.risk,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def save_patch(
    db: Session,
    run_id: str,
    patch: PatchInfoSchema,
) -> PatchModel:
    """Persist or update the generated patch and test outcomes for a run."""
    stmt = select(PatchModel).where(PatchModel.run_id == run_id)
    existing = db.scalars(stmt).first()
    test_results_json = json.dumps([t.model_dump() for t in patch.test_results])

    if existing:
        existing.diff_text = patch.diff_text
        existing.plan_summary = patch.plan_summary
        existing.verified = patch.verified
        existing.test_results_json = test_results_json
        existing.sandbox_log = patch.sandbox_log
        db.commit()
        db.refresh(existing)
        return existing

    record = PatchModel(
        id=f"pat-{uuid.uuid4().hex[:8]}",
        run_id=run_id,
        diff_text=patch.diff_text,
        plan_summary=patch.plan_summary,
        verified=patch.verified,
        test_results_json=test_results_json,
        sandbox_log=patch.sandbox_log,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_patch_for_run(db: Session, run_id: str) -> PatchModel | None:
    """Retrieve patch record associated with a run."""
    stmt = select(PatchModel).where(PatchModel.run_id == run_id)
    return db.scalars(stmt).first()
