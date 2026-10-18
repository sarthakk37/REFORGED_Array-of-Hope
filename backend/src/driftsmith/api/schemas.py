"""Pydantic schemas mirroring the exact DriftSmith API contract."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["viewer", "approver", "admin"]
RunStatus = Literal[
    "queued",
    "running",
    "verified",
    "failed",
    "awaiting_approval",
    "approved",
    "rejected",
]
Scenario = Literal["rename", "type", "nested"]
RunSource = Literal["manual", "webhook", "ci", "n8n"]
AgentName = Literal[
    "sentinel", "triage", "locator", "coder", "critic", "verifier", "memory", "pr", "system"
]
EventKind = Literal["info", "thought", "action", "success", "warning", "error"]
DriftChangeType = Literal["renamed", "type_changed", "moved", "added", "removed"]
RiskLevel = Literal["low", "medium", "high"]
IntegrationName = Literal["database", "llm", "github", "slack", "sandbox", "n8n"]
IntegrationStatus = Literal["live", "dry_run", "disabled", "down"]


class ErrorResponse(BaseModel):
    """Standardized error envelope."""

    detail: str


class UserSchema(BaseModel):
    """User profile representation."""

    id: str
    email: str
    role: Role


class LoginRequest(BaseModel):
    """Credentials for email/password authentication."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """JWT bearer token and authenticated user payload."""

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserSchema


class RunSchema(BaseModel):
    """Remediation run summary."""

    id: str
    scenario: Scenario
    service_name: str
    source: RunSource
    external_ref: str | None = None
    status: RunStatus
    confidence: float | None = None
    verified: bool
    healed_from_memory: bool
    llm_calls: int
    iterations: int
    started_at: str
    finished_at: str | None = None


class RunEventSchema(BaseModel):
    """Real-time timeline event emitted by pipeline agents."""

    id: str
    run_id: str
    seq: int
    agent: AgentName
    kind: EventKind
    message: str
    payload: dict[str, Any] | None = None
    created_at: str


class DriftChangeSchema(BaseModel):
    """Individual detected schema mutation."""

    model_config = ConfigDict(populate_by_name=True)

    type: DriftChangeType
    path: str
    from_: str | None = Field(default=None, alias="from")
    to: str | None = None
    confidence: float


class DriftReportSchema(BaseModel):
    """Synthesized drift report with risk assessment."""

    fingerprint: str
    summary: str
    changes: list[DriftChangeSchema]
    risk: RiskLevel


class TestCaseResultSchema(BaseModel):
    """Individual contract or unit test result in sandbox."""

    __test__ = False

    name: str
    payload_version: Literal["old", "new"]
    passed: bool
    duration_ms: int
    output: str | None = None


class PatchInfoSchema(BaseModel):
    """Unified diff and sandbox verification logs."""

    diff_text: str
    plan_summary: str
    verified: bool
    test_results: list[TestCaseResultSchema]
    sandbox_log: str


class PullRequestInfoSchema(BaseModel):
    """Pull request preview or live GitHub PR details."""

    url: str | None = None
    branch: str
    status: Literal["dry_run", "open", "merged"]
    dry_run: bool


class RunDetailSchema(RunSchema):
    """Complete remediation run detail including diff and PR state."""

    drift_report: DriftReportSchema | None = None
    patch: PatchInfoSchema | None = None
    pull_request: PullRequestInfoSchema | None = None


class LearnedPatternSchema(BaseModel):
    """Remembered fix pattern enabling zero-inference healing."""

    id: str
    fingerprint: str
    summary: str
    times_used: int
    created_at: str


class IntegrationStateSchema(BaseModel):
    """Subsystem status and diagnostic detail."""

    name: IntegrationName
    status: IntegrationStatus
    detail: str


class HealthResponse(BaseModel):
    """Truthful health response covering all backend subsystems."""

    status: Literal["ok", "degraded"]
    llm_mode: Literal["live", "replay", "mock"]
    auth_enabled: bool
    integrations: list[IntegrationStateSchema]


class TriggerDriftRequest(BaseModel):
    """Payload to trigger remediation via simulation UI."""

    scenario: Scenario
    service_name: str
    source: RunSource = "manual"
    external_ref: str | None = None


class WebhookDriftRequest(BaseModel):
    """Payload for upstream webhook drift ingestion."""

    service_name: str
    scenario: Scenario
    source: RunSource = "webhook"
    external_ref: str | None = None
    payload: dict[str, Any] | None = None


class TriggerDriftResponse(BaseModel):
    """Asynchronous run trigger acknowledgement."""

    run_id: str


class ApproveResponse(BaseModel):
    """Approval confirmation with updated PR information."""

    status: Literal["approved"] = "approved"
    pull_request: PullRequestInfoSchema
