"""Slack notification integration adapter."""

import logging

import httpx

from driftsmith.config import settings

logger = logging.getLogger("driftsmith.integrations.slack")


def notify_slack(message: str) -> None:
    """Send alert notification to configured Slack webhook or log dry-run."""
    if not settings.slack_webhook_url:
        logger.info("[Slack Dry-Run] %s", message)
        return

    try:
        with httpx.Client(timeout=5.0) as client:
            client.post(settings.slack_webhook_url, json={"text": message})
    except Exception as exc:
        logger.warning("Failed to dispatch Slack notification: %s", exc)
