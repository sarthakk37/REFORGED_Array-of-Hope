"""Prompt response caching for deterministic offline replay."""

import hashlib
import json

from driftsmith.config import settings


def compute_prompt_hash(prompt: str) -> str:
    """Calculate SHA256 hex digest for a prompt string."""
    return hashlib.sha256(prompt.strip().encode("utf-8")).hexdigest()[:16]


def get_cached_response(prompt_hash: str) -> str | None:
    """Retrieve cached response by prompt hash if it exists."""
    replay_file = settings.replay_dir / f"{prompt_hash}.json"
    if replay_file.exists():
        try:
            with open(replay_file, encoding="utf-8") as f:
                data = json.load(f)
                return data.get("response")
        except (json.JSONDecodeError, OSError):
            return None
    return None


def store_cached_response(prompt_hash: str, prompt: str, response: str) -> None:
    """Persist a live prompt and response to the replay fixtures directory."""
    settings.replay_dir.mkdir(parents=True, exist_ok=True)
    replay_file = settings.replay_dir / f"{prompt_hash}.json"
    payload = {
        "hash": prompt_hash,
        "prompt": prompt,
        "response": response,
    }
    with open(replay_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
