"""Critic agent reviewing failed test runs and suggesting plan adjustments."""

import json
from pathlib import Path

from pydantic import BaseModel

from driftsmith.ai.llm_client import llm_client
from driftsmith.config import settings
from driftsmith.core.patch_plan import PatchPlan

PROMPT_FILE = Path(__file__).resolve().parent.parent / "prompts" / "critic.md"


class CriticFeedback(BaseModel):
    """Actionable feedback from the Critic agent after a sandbox test failure."""

    diagnosis: str
    suggested_fix: str
    should_retry: bool = True


class CriticAgent:
    """Agent analyzing sandbox test failures to guide Coder retries."""

    def __init__(self) -> None:
        with open(PROMPT_FILE, encoding="utf-8") as f:
            self.prompt_template = f.read()

    def evaluate_failure(
        self,
        scenario: str,
        patch_plan: PatchPlan,
        test_failure_output: str,
    ) -> CriticFeedback:
        """Inspect sandbox failure and emit constructive feedback."""
        prompt = (
            self.prompt_template.replace("{scenario}", scenario)
            .replace("{patch_plan}", patch_plan.model_dump_json())
            .replace("{test_failure_output}", test_failure_output)
        )

        mock_key = f"critic_{scenario}"
        raw_response = llm_client.generate(
            prompt=prompt,
            model=settings.gemma_model_diag,
            mock_key=mock_key,
        )

        try:
            clean = raw_response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(clean)
            return CriticFeedback(**data)
        except Exception:
            return CriticFeedback(
                diagnosis=f"Sandbox test failed for scenario {scenario}: {test_failure_output[:120]}",
                suggested_fix="Adjust patch plan parameters and retry with correct data scaling.",
                should_retry=True,
            )
