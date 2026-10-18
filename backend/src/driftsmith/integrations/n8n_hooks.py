"""Outbound n8n workflow notification hooks."""

import logging
from typing import Any

import httpx

from driftsmith.config import settings

logger = logging.getLogger("driftsmith.integrations.n8n")


def fire_n8n_completion_webhook(payload: dict[str, Any]) -> None:
    """Send run completion webhook to configured n8n orchestration instance."""
    if not settings.n8n_webhook_url:
        logger.info("[n8n Hook Dry-Run] Run finished: %s", payload.get("run_id"))
        return

    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.n8n_webhook_url, json=payload)
    except Exception as exc:
        logger.warning("Failed to trigger outbound n8n webhook: %s", exc)
