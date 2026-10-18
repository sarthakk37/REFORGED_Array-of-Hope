"""FastAPI mock payment provider service for DriftSmith API drift demonstrations."""

from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from mock_provider.payloads import PAYLOADS

app = FastAPI(
    title="DriftSmith Mock Payment Provider (Demo Only)",
    description="Simulates upstream payment provider API drifts for testing remediation.",
    version="0.1.0",
)

# Open CORS for local demonstration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory provider state (resets to v1 on restart)
_state: dict[str, str] = {"mode": "v1"}


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint confirming provider service is operational."""
    return {"status": "ok"}


@app.get("/payload")
def get_payload() -> dict[str, Any]:
    """Retrieve the active webhook payload for the current drift mode."""
    current_mode = _state["mode"]
    payload = PAYLOADS.get(current_mode)
    if payload is None:
        raise HTTPException(
            status_code=500, detail=f"Payload not configured for mode: {current_mode}"
        )
    return payload


@app.post("/admin/drift")
def set_drift_mode(
    mode: str = Query(..., description="Drift mode: v1, rename, type, or nested")
) -> dict[str, str]:
    """Switch active drift emission mode on the mock payment provider."""
    if mode not in PAYLOADS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid drift mode '{mode}'. Allowed modes: {list(PAYLOADS.keys())}",
        )
    previous = _state["mode"]
    _state["mode"] = mode
    return {"mode": mode, "previous": previous}


@app.get("/admin/state")
def get_admin_state() -> dict[str, str]:
    """Return the current drift mode and provider operational state."""
    return {"mode": _state["mode"]}
