"""Service orchestrating remediation run creation and background dispatch."""

import threading
import uuid
from typing import Any

from driftsmith.api.schemas import RunSource, Scenario
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.db.session import SessionLocal
from driftsmith.services.pipeline import pipeline


def trigger_remediation_run(
    scenario: Scenario,
    service_name: str,
    source: RunSource = "manual",
    external_ref: str | None = None,
    payload: dict[str, Any] | None = None,
    sync: bool = False,
) -> str:
    """Create a remediation run and trigger background pipeline execution."""
    run_id = f"run-{uuid.uuid4().hex[:6]}"

    with SessionLocal() as db:
        runs_repo.create_run(
            db=db,
            run_id=run_id,
            scenario=scenario,
            service_name=service_name,
            source=source,
            external_ref=external_ref,
        )

    def _execute() -> None:
        with SessionLocal() as worker_db:
            pipeline.run(
                db=worker_db,
                run_id=run_id,
                scenario=scenario,
                service_name=service_name,
                provided_payload=payload,
            )

    if sync:
        _execute()
    else:
        thread = threading.Thread(target=_execute, daemon=True)
        thread.start()

    return run_id
