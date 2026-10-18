"""Coder agent generating backward-compatible PatchPlans validated by Pydantic."""

import json
from pathlib import Path

from driftsmith.ai.agents.critic import CriticFeedback
from driftsmith.ai.llm_client import llm_client
from driftsmith.api.schemas import DriftReportSchema
from driftsmith.config import settings
from driftsmith.core.locator import CodeSite
from driftsmith.core.patch_plan import PatchPlan

PROMPT_FILE = Path(__file__).resolve().parent.parent / "prompts" / "coder.md"


class CoderAgent:
    """Agent producing structured PatchPlans from drift analysis and AST code sites."""

    def __init__(self) -> None:
        with open(PROMPT_FILE, encoding="utf-8") as f:
            self.prompt_template = f.read()

    def generate_plan(
        self,
        scenario: str,
        target_file: str,
        drift_report: DriftReportSchema,
        code_sites: list[CodeSite],
        critic_feedback: CriticFeedback | None = None,
        iteration: int = 1,
    ) -> PatchPlan:
        """Formulate a declarative PatchPlan to heal API drift."""
        sites_str = json.dumps([s.model_dump() for s in code_sites])
        critic_str = critic_feedback.model_dump_json() if critic_feedback else "None"

        prompt = (
            self.prompt_template.replace("{scenario}", scenario)
            .replace("{target_file}", target_file)
            .replace("{drift_report}", drift_report.model_dump_json())
            .replace("{code_sites}", sites_str)
            .replace("{critic_feedback}", critic_str)
        )

        mock_key = f"coder_{scenario}"
        if scenario == "type":
            mock_key = f"coder_type_iteration{iteration}"

        raw_response = llm_client.generate(
            prompt=prompt,
            model=settings.gemma_model_code,
            mock_key=mock_key,
        )

        clean = raw_response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(clean)
        return PatchPlan(**data)
