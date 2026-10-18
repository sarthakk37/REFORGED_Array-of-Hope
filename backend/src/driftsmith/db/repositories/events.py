"""Repository for persisting sequence-ordered run events."""

import json
import uuid
from typing import Any

from sqlalchemy import asc, select
from sqlalchemy.orm import Session

from driftsmith.api.schemas import AgentName, EventKind, RunEventSchema
from driftsmith.db.models import RunEventModel


def add_event(
    db: Session,
    run_id: str,
    seq: int,
    agent: AgentName,
    kind: EventKind,
    message: str,
    payload: dict[str, Any] | None = None,
    event_id: str | None = None,
) -> RunEventModel:
    """Persist an event to the run timeline."""
    eid = event_id or f"evt-{uuid.uuid4().hex[:8]}"
    event = RunEventModel(
        id=eid,
        run_id=run_id,
        seq=seq,
        agent=agent,
        kind=kind,
        message=message,
        payload_json=json.dumps(payload) if payload is not None else None,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def list_events(db: Session, run_id: str) -> list[RunEventModel]:
    """Retrieve all timeline events for a run ordered by sequence number."""
    stmt = (
        select(RunEventModel).where(RunEventModel.run_id == run_id).order_by(asc(RunEventModel.seq))
    )
    return list(db.scalars(stmt).all())


def to_schema(model: RunEventModel) -> RunEventSchema:
    """Convert RunEventModel to contract RunEventSchema."""
    return RunEventSchema(
        id=model.id,
        run_id=model.run_id,
        seq=model.seq,
        agent=model.agent,  # type: ignore[arg-type]
        kind=model.kind,  # type: ignore[arg-type]
        message=model.message,
        payload=json.loads(model.payload_json) if model.payload_json else None,
        created_at=model.created_at.isoformat(),
    )
