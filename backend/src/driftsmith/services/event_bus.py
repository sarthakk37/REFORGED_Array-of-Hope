"""In-process event bus persisting events to DB and streaming to SSE subscribers."""

import asyncio
from typing import Any

from sqlalchemy.orm import Session

from driftsmith.api.schemas import AgentName, EventKind, RunEventSchema
from driftsmith.db.repositories import events as events_repo


class EventBus:
    """Pub/sub bus broadcasting run events to SSE listeners and persisting to DB."""

    def __init__(self) -> None:
        self._subscribers: dict[str, list[asyncio.Queue[RunEventSchema]]] = {}
        self._lock = asyncio.Lock()

    def emit(
        self,
        db: Session,
        run_id: str,
        seq: int,
        agent: AgentName,
        kind: EventKind,
        message: str,
        payload: dict[str, Any] | None = None,
    ) -> RunEventSchema:
        """Persist event to database and push to all registered SSE subscriber queues."""
        model = events_repo.add_event(
            db=db,
            run_id=run_id,
            seq=seq,
            agent=agent,
            kind=kind,
            message=message,
            payload=payload,
        )
        schema = events_repo.to_schema(model)

        # Dispatch non-blocking to active async queues
        queues = self._subscribers.get(run_id, [])
        for q in queues:
            try:
                q.put_nowait(schema)
            except asyncio.QueueFull:
                pass

        return schema

    def subscribe(self, run_id: str) -> asyncio.Queue[RunEventSchema]:
        """Register a new listener queue for SSE streaming."""
        queue: asyncio.Queue[RunEventSchema] = asyncio.Queue(maxsize=100)
        if run_id not in self._subscribers:
            self._subscribers[run_id] = []
        self._subscribers[run_id].append(queue)
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue[RunEventSchema]) -> None:
        """Deregister an SSE listener queue."""
        if run_id in self._subscribers:
            try:
                self._subscribers[run_id].remove(queue)
                if not self._subscribers[run_id]:
                    del self._subscribers[run_id]
            except ValueError:
                pass


event_bus = EventBus()
