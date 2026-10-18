"""Server-Sent Events (SSE) router streaming real-time agent execution logs."""

import asyncio
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from driftsmith.api.deps import get_current_user, get_db_session
from driftsmith.api.schemas import UserSchema
from driftsmith.db.repositories import events as events_repo
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.services.event_bus import event_bus

router = APIRouter(tags=["events"])


async def _event_stream_generator(
    run_id: str,
    db: Session,
) -> AsyncGenerator[str, None]:
    """Yield Server-Sent Event formatted chunks for stored and live run events."""
    # 1. Stream existing persisted events first
    existing = events_repo.list_events(db, run_id)
    seen_ids: set[str] = set()
    is_finished = False

    for model in existing:
        schema = events_repo.to_schema(model)
        seen_ids.add(schema.id)
        yield f"data: {schema.model_dump_json()}\n\n"
        if schema.agent == "system" and schema.message == "run_finished":
            is_finished = True
            break

    if is_finished:
        return

    # 2. Subscribe to live bus queue for ongoing runs
    queue = event_bus.subscribe(run_id)
    try:
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15.0)
                if event.id not in seen_ids:
                    seen_ids.add(event.id)
                    yield f"data: {event.model_dump_json()}\n\n"
                    if event.agent == "system" and event.message == "run_finished":
                        break
            except TimeoutError:
                # Keep-alive comment frame preventing client disconnects
                yield ": keep-alive\n\n"
    finally:
        event_bus.unsubscribe(run_id, queue)


@router.get("/api/runs/{id}/events")
@router.get("/api/runs/{id}/stream")
@router.get("/runs/{id}/events")
def stream_run_events(
    id: str,
    db: Session = Depends(get_db_session),
    _: UserSchema = Depends(get_current_user),
) -> StreamingResponse:
    """Stream real-time agent thoughts and verification results over SSE."""
    run = runs_repo.get_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run '{id}' not found",
        )

    return StreamingResponse(
        _event_stream_generator(id, db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
