"""Learned patterns telemetry router."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from driftsmith.api.deps import get_current_user, get_db_session
from driftsmith.api.schemas import LearnedPatternSchema, UserSchema
from driftsmith.db.repositories import patterns as patterns_repo

router = APIRouter(tags=["patterns"])


@router.get("/api/patterns", response_model=list[LearnedPatternSchema])
@router.get("/patterns", response_model=list[LearnedPatternSchema])
def list_patterns(
    db: Session = Depends(get_db_session),
    _: UserSchema = Depends(get_current_user),
) -> list[LearnedPatternSchema]:
    """Retrieve remembered fixes enabling zero-inference remediation."""
    records = patterns_repo.list_patterns(db)
    return [patterns_repo.to_schema(p) for p in records]
