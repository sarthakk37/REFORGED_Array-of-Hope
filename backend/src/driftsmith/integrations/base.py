"""Common interfaces and data models for external integrations."""

from pydantic import BaseModel

from driftsmith.api.schemas import TestCaseResultSchema


class SandboxResult(BaseModel):
    """Result of running target test suites inside an isolated sandbox."""

    verified: bool
    test_results: list[TestCaseResultSchema]
    sandbox_log: str
    error_output: str = ""
