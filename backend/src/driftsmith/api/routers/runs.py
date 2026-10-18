"""Remediation runs router managing run lifecycle, simulation, and approval."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from driftsmith.api.deps import get_current_user, get_db_session, require_approver
from driftsmith.api.schemas import (
    ApproveResponse,
    RunDetailSchema,
    RunSchema,
    TriggerDriftRequest,
    TriggerDriftResponse,
    UserSchema,
)
from driftsmith.db.repositories import runs as runs_repo
from driftsmith.services.approval_service import approve_run as execute_approval
from driftsmith.services.run_service import trigger_remediation_run

router = APIRouter(tags=["runs"])


@router.get("/api/runs", response_model=list[RunSchema])
@router.get("/runs", response_model=list[RunSchema])
def list_runs(
    db: Session = Depends(get_db_session),
    _: UserSchema = Depends(get_current_user),
) -> list[RunSchema]:
    """Retrieve all remediation runs sorted descending by start time."""
    records = runs_repo.list_runs(db)
    return [runs_repo.to_schema(r) for r in records]


@router.get("/api/runs/{id}", response_model=RunDetailSchema)
@router.get("/runs/{id}", response_model=RunDetailSchema)
def get_run(
    id: str,
    db: Session = Depends(get_db_session),
    _: UserSchema = Depends(get_current_user),
) -> RunDetailSchema:
    """Retrieve full details, drift diagnosis report, diff, and PR status for a run."""
    run = runs_repo.get_run(db, id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run '{id}' not found",
        )
    return runs_repo.to_detail_schema(run)


@router.post("/api/runs/{id}/approve", response_model=ApproveResponse)
@router.post("/runs/{id}/approve", response_model=ApproveResponse)
def approve_run(
    id: str,
    db: Session = Depends(get_db_session),
    _: UserSchema = Depends(require_approver),
) -> ApproveResponse:
    """Approve a proposed self-healing patch and promote the pull request."""
    try:
        return execute_approval(db, id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


@router.post("/api/runs/simulate", response_model=TriggerDriftResponse, status_code=202)
@router.post("/runs/simulate", response_model=TriggerDriftResponse, status_code=202)
def simulate_run(
    request: TriggerDriftRequest,
    _: UserSchema = Depends(get_current_user),
) -> TriggerDriftResponse:
    """Manually initiate a self-healing remediation run in background."""
    run_id = trigger_remediation_run(
        scenario=request.scenario,
        service_name=request.service_name,
        source=request.source,
        external_ref=request.external_ref,
        sync=False,
    )
    return TriggerDriftResponse(run_id=run_id)
