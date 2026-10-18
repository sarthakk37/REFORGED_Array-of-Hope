"""Demo simulation trigger router."""

from fastapi import APIRouter, Depends

from driftsmith.api.deps import get_current_user
from driftsmith.api.schemas import TriggerDriftRequest, TriggerDriftResponse, UserSchema
from driftsmith.services.run_service import trigger_remediation_run

router = APIRouter(tags=["demo"])


@router.post("/api/demo/drift", response_model=TriggerDriftResponse, status_code=202)
def trigger_demo_drift(
    request: TriggerDriftRequest,
    _: UserSchema = Depends(get_current_user),
) -> TriggerDriftResponse:
    """Trigger a demo drift run from the interactive frontend simulator."""
    run_id = trigger_remediation_run(
        scenario=request.scenario,
        service_name=request.service_name,
        source=request.source,
        external_ref=request.external_ref,
        sync=False,
    )
    return TriggerDriftResponse(run_id=run_id)
