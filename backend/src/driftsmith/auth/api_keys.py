"""API Key authentication for machine-to-machine and webhook ingestion."""

from fastapi import Header, HTTPException, status

from driftsmith.config import settings


def verify_api_key(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    x_driftsmith_key: str | None = Header(None, alias="X-DriftSmith-Key"),
) -> str:
    """Verify shared secret API key from X-API-Key or X-DriftSmith-Key headers."""
    provided_key = x_api_key or x_driftsmith_key
    if not provided_key or provided_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing webhook signature",
        )
    return provided_key
