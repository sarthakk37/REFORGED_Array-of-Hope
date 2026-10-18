// ALL shared TypeScript types for DriftSmith API Contract.
// Defined strictly to match the upcoming backend endpoints without improvisation.

export type Role = 'viewer' | 'approver' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export type RunStatus =
  | 'queued'
  | 'running'
  | 'verified'
  | 'failed'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected';

export type Scenario = 'rename' | 'type' | 'nested';

export interface Run {
  id: string;
  scenario: Scenario;
  service_name: string;
  source: 'manual' | 'webhook' | 'ci';
  status: RunStatus;
  confidence: number | null; // 0..1
  verified: boolean;
  healed_from_memory: boolean;
  llm_calls: number;
  iterations: number;
  started_at: string; // ISO
  finished_at: string | null;
}

export type AgentName =
  | 'sentinel'
  | 'triage'
  | 'locator'
  | 'coder'
  | 'critic'
  | 'verifier'
  | 'memory'
  | 'pr'
  | 'system';

export type EventKind = 'info' | 'thought' | 'action' | 'success' | 'warning' | 'error';

export interface RunEvent {
  id: string;
  run_id: string;
  seq: number;
  agent: AgentName;
  kind: EventKind;
  message: string;
  payload: Record<string, unknown> | null;
  created_at: string; // ISO
}

export type DriftChangeType = 'renamed' | 'type_changed' | 'moved' | 'added' | 'removed';

export interface DriftChange {
  type: DriftChangeType;
  path: string;
  from: string | null;
  to: string | null;
  confidence: number;
}

export interface DriftReport {
  fingerprint: string;
  summary: string;
  changes: DriftChange[];
  risk: 'low' | 'medium' | 'high';
}

export interface TestCaseResult {
  name: string;
  payload_version: 'old' | 'new';
  passed: boolean;
  duration_ms: number;
  output: string | null;
}

export interface PatchInfo {
  diff_text: string; // Unified diff format
  plan_summary: string;
  verified: boolean;
  test_results: TestCaseResult[];
  sandbox_log: string;
}

export interface PullRequestInfo {
  url: string | null;
  branch: string;
  status: 'dry_run' | 'open' | 'merged';
  dry_run: boolean;
}

export type RunDetail = Run & {
  drift_report: DriftReport | null;
  patch: PatchInfo | null;
  pull_request: PullRequestInfo | null;
};

export interface LearnedPattern {
  id: string;
  fingerprint: string;
  summary: string;
  times_used: number;
  created_at: string;
}

export type IntegrationName = 'database' | 'llm' | 'github' | 'slack' | 'sandbox' | 'n8n';

export type IntegrationStatus = 'live' | 'dry_run' | 'disabled' | 'down';

export interface IntegrationState {
  name: IntegrationName;
  status: IntegrationStatus;
  detail: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  llm_mode: 'live' | 'replay' | 'mock';
  auth_enabled: boolean;
  integrations: IntegrationState[];
}

export interface TriggerDriftRequest {
  scenario: Scenario;
  service_name: string;
}

export interface TriggerDriftResponse {
  run_id: string;
}

export interface ApproveResponse {
  status: 'approved';
  pull_request: PullRequestInfo;
}

export interface ApiErrorDetail {
  detail: string;
  status_code?: number;
}
