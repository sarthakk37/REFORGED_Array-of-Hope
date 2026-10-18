"""Repository for learned fix pattern persistence and zero-inference lookups."""

import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import LearnedPatternSchema
from driftsmith.core.patch_plan import PatchPlan
from driftsmith.db.models import LearnedPatternModel


def get_by_fingerprint(db: Session, fingerprint: str) -> LearnedPatternModel | None:
    """Look up a remembered fix pattern by its unique fingerprint."""
    stmt = select(LearnedPatternModel).where(LearnedPatternModel.fingerprint == fingerprint)
    return db.scalars(stmt).first()


def list_patterns(db: Session, limit: int = 50) -> list[LearnedPatternModel]:
    """Retrieve all stored remediation patterns ordered by creation date."""
    stmt = select(LearnedPatternModel).order_by(desc(LearnedPatternModel.created_at)).limit(limit)
    return list(db.scalars(stmt).all())


def save_pattern(
    db: Session,
    fingerprint: str,
    summary: str,
    plan: PatchPlan,
) -> LearnedPatternModel:
    """Store or update a learned fix pattern."""
    existing = get_by_fingerprint(db, fingerprint)
    if existing:
        existing.summary = summary
        existing.plan_json = plan.model_dump_json()
        db.commit()
        db.refresh(existing)
        return existing

    pattern = LearnedPatternModel(
        id=f"pat-{uuid.uuid4().hex[:8]}",
        fingerprint=fingerprint,
        summary=summary,
        plan_json=plan.model_dump_json(),
        times_used=0,
        calls_saved=0,
    )
    db.add(pattern)
    db.commit()
    db.refresh(pattern)
    return pattern


def increment_usage(
    db: Session,
    fingerprint: str,
    calls_saved: int = 3,
) -> LearnedPatternModel | None:
    """Increment times_used and calls_saved counter when a pattern heals from memory."""
    pattern = get_by_fingerprint(db, fingerprint)
    if not pattern:
        return None

    pattern.times_used += 1
    pattern.calls_saved += calls_saved
    db.commit()
    db.refresh(pattern)
    return pattern


def to_schema(model: LearnedPatternModel) -> LearnedPatternSchema:
    """Convert LearnedPatternModel to contract LearnedPatternSchema."""
    return LearnedPatternSchema(
        id=model.id,
        fingerprint=model.fingerprint,
        summary=model.summary,
        times_used=model.times_used,
        created_at=model.created_at.isoformat(),
    )
