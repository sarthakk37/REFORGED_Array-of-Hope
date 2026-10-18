// Central ApiClient interface for DriftSmith client implementations.
// Both httpClient (real backend) and mockClient (in-memory demo) implement this contract.

import {
  User,
  LoginRequest,
  LoginResponse,
  Run,
  RunDetail,
  LearnedPattern,
  HealthResponse,
  TriggerDriftRequest,
  TriggerDriftResponse,
  WebhookDriftRequest,
  ApproveResponse,
} from './types';

export interface ApiClient {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  getMe(): Promise<User>;
  getRuns(): Promise<Run[]>;
  getRun(id: string): Promise<RunDetail>;
  approveRun(id: string): Promise<ApproveResponse>;
  getPatterns(): Promise<LearnedPattern[]>;
  triggerDrift(request: TriggerDriftRequest): Promise<TriggerDriftResponse>;
  triggerWebhook(request: WebhookDriftRequest): Promise<TriggerDriftResponse>;
  getHealth(): Promise<HealthResponse>;
}
