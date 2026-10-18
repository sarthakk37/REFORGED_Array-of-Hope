"""LLM client wrapping Google Gemma via Gemini API with replay and mock modes."""

import logging

from driftsmith.ai.cache import compute_prompt_hash, get_cached_response, store_cached_response
from driftsmith.config import settings

logger = logging.getLogger("driftsmith.ai")


class LLMClient:
    """Unified LLM client dispatching to live API, replay cache, or scripted mocks."""

    def __init__(self) -> None:
        self.mode = settings.llm_mode
        self._genai_client: object | None = None
        if self.mode == "live" and settings.gemini_api_key:
            try:
                from google import genai

                self._genai_client = genai.Client(api_key=settings.gemini_api_key)
            except ImportError:
                logger.warning("google-genai SDK not available; falling back to mock")
                self.mode = "mock"

    def generate(
        self,
        prompt: str,
        model: str | None = None,
        mock_key: str | None = None,
    ) -> str:
        """Generate response text using live Gemini API, replay cache, or scripted mock."""
        target_model = model or settings.gemma_model_diag
        prompt_hash = compute_prompt_hash(prompt)

        # 1. Replay mode
        if self.mode == "replay":
            cached = get_cached_response(prompt_hash)
            if cached:
                return cached
            logger.warning("Replay miss for hash %s, falling back to mock", prompt_hash)

        # 2. Mock mode
        if self.mode == "mock" or not self._genai_client:
            return self._get_mock_response(mock_key)

        # 3. Live mode via google-genai SDK
        try:
            from google import genai  # noqa: F401

            client: any = self._genai_client
            response = client.models.generate_content(
                model=target_model,
                contents=prompt,
            )
            text = response.text or ""
            store_cached_response(prompt_hash, prompt, text)
            return text
        except Exception as exc:
            logger.error("Live LLM generation failed: %s; falling back to replay/mock", exc)
            cached = get_cached_response(prompt_hash)
            if cached:
                return cached
            return self._get_mock_response(mock_key)

    def _get_mock_response(self, mock_key: str | None) -> str:
        """Read scripted JSON mock from backend/fixtures/llm_mock/."""
        if not mock_key:
            return "{}"

        mock_file = settings.mock_dir / f"{mock_key}.json"
        if mock_file.exists():
            with open(mock_file, encoding="utf-8") as f:
                return f.read()

        logger.warning("Mock fixture not found: %s", mock_file)
        return "{}"


llm_client = LLMClient()
