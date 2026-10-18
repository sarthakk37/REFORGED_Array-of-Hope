"""Webhook ingestion router for external orchestrations like n8n."""

from fastapi import APIRouter, Depends

from driftsmith.api.schemas import TriggerDriftResponse, WebhookDriftRequest
from driftsmith.auth.api_keys import verify_api_key
from driftsmith.services.run_service import trigger_remediation_run

router = APIRouter(tags=["webhooks"])


@router.post("/api/webhooks/incident", response_model=TriggerDriftResponse, status_code=202)
@router.post("/api/v1/webhooks/drift", response_model=TriggerDriftResponse, status_code=202)
def receive_drift_webhook(
    request: WebhookDriftRequest,
    _: str = Depends(verify_api_key),
) -> TriggerDriftResponse:
    """Ingest upstream API drift notification triggered by n8n or monitoring listeners."""
    run_id = trigger_remediation_run(
        scenario=request.scenario,
        service_name=request.service_name,
        source=request.source,
        external_ref=request.external_ref,
        payload=request.payload,
        sync=False,
    )
    return TriggerDriftResponse(run_id=run_id)
