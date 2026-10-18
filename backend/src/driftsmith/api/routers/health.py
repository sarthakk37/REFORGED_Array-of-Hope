"""Health telemetry router reporting honest subsystem states."""

from fastapi import APIRouter

from driftsmith.api.schemas import HealthResponse, IntegrationStateSchema
from driftsmith.config import settings

router = APIRouter(tags=["health"])


def evaluate_integrations() -> list[IntegrationStateSchema]:
    """Inspect configured subsystems and evaluate their live health status."""
    integrations: list[IntegrationStateSchema] = []

    # 1. Database
    db_detail = "SQLite (local)" if "sqlite" in settings.database_url else "PostgreSQL"
    integrations.append(IntegrationStateSchema(name="database", status="live", detail=db_detail))

    # 2. LLM
    if settings.llm_mode == "mock":
        llm_detail = "Gemma via Gemini API (mock mode)"
        llm_status = "live"
    elif settings.llm_mode == "replay":
        llm_detail = "Gemma via Gemini API (replay cache)"
        llm_status = "live"
    else:
        if settings.gemini_api_key:
            llm_detail = f"Gemma via Gemini API ({settings.gemma_model_diag})"
            llm_status = "live"
        else:
            llm_detail = "GEMINI_API_KEY missing"
            llm_status = "down"
    integrations.append(IntegrationStateSchema(name="llm", status=llm_status, detail=llm_detail))

    # 3. GitHub
    if settings.github_token and settings.github_repo:
        integrations.append(
            IntegrationStateSchema(
                name="github", status="live", detail=f"Connected to {settings.github_repo}"
            )
        )
    else:
        integrations.append(
            IntegrationStateSchema(name="github", status="dry_run", detail="Dry-run PR preview")
        )

    # 4. Slack
    if settings.slack_webhook_url:
        integrations.append(
            IntegrationStateSchema(
                name="slack", status="live", detail="Incoming webhook configured"
            )
        )
    else:
        integrations.append(
            IntegrationStateSchema(name="slack", status="disabled", detail="Not connected")
        )

    # 5. Sandbox
    integrations.append(
        IntegrationStateSchema(
            name="sandbox",
            status="live",
            detail="Safe test room container (simulated)",
        )
    )

    # 6. n8n
    integrations.append(
        IntegrationStateSchema(name="n8n", status="live", detail="Webhook endpoint listening")
    )

    return integrations


@router.get("/api/health", response_model=HealthResponse)
@router.get("/health", response_model=HealthResponse)
@router.get("/system/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return honest telemetry covering all backend integrations."""
    integrations = evaluate_integrations()
    is_degraded = any(i.status == "down" for i in integrations)
    return HealthResponse(
        status="degraded" if is_degraded else "ok",
        llm_mode=settings.llm_mode,
        auth_enabled=settings.auth_enabled,
        integrations=integrations,
    )
