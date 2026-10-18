"""Triage agent diagnosing root causes of detected schema drifts."""

import json
from pathlib import Path

from pydantic import BaseModel

from driftsmith.ai.llm_client import llm_client
from driftsmith.api.schemas import DriftReportSchema, RiskLevel
from driftsmith.config import settings

PROMPT_FILE = Path(__file__).resolve().parent.parent / "prompts" / "triage.md"


class TriageDiagnosis(BaseModel):
    """Structured diagnosis emitted by the Triage agent."""

    summary: str
    confidence: float
    risk: RiskLevel
    affected_fields: list[str]


class TriageAgent:
    """Agent diagnosing API schema drift failures and assessing risk."""

    def __init__(self) -> None:
        with open(PROMPT_FILE, encoding="utf-8") as f:
            self.prompt_template = f.read()

    def diagnose(
        self,
        scenario: str,
        service_name: str,
        drift_report: DriftReportSchema,
    ) -> TriageDiagnosis:
        """Analyze drift report and produce structured diagnosis."""
        changes_str = json.dumps([c.model_dump() for c in drift_report.changes])
        prompt = (
            self.prompt_template.replace("{scenario}", scenario)
            .replace("{service_name}", service_name)
            .replace("{changes}", changes_str)
        )

        mock_key = f"triage_{scenario}"
        raw_response = llm_client.generate(
            prompt=prompt,
            model=settings.gemma_model_diag,
            mock_key=mock_key,
        )

        try:
            # Clean potential markdown fences
            clean = raw_response.strip()
            if clean.startswith("```"):
                clean = clean.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            data = json.loads(clean)
            return TriageDiagnosis(**data)
        except Exception:
            return TriageDiagnosis(
                summary=drift_report.summary,
                confidence=0.95,
                risk=drift_report.risk,
                affected_fields=[c.path for c in drift_report.changes],
            )
