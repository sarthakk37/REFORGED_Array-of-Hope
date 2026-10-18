// In-memory Mock implementation of ApiClient for standalone demo mode.
// Simulates 300-600ms latency, state mutations, memory healing, and approval transitions.

import { ApiClient } from './apiClient';
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
  ApproveResponse,
} from './types';
import { MOCK_USERS, MOCK_PASSWORD } from '@/mock/users';
import { INITIAL_MOCK_RUNS } from '@/mock/runs';
import { INITIAL_MOCK_PATTERNS } from '@/mock/patterns';
import { MOCK_HEALTH } from '@/mock/health';
import { DRIFT_SCENARIOS } from '@/mock/drifts';
import { registerMockRunForStream } from './mockStream';
import { tokenStorage } from '@/auth/tokenStorage';

// Simulated realistic network latency helper (300ms - 600ms)
const simulateLatency = (min = 300, max = 600): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class MockClient implements ApiClient {
  private runs: RunDetail[] = [...INITIAL_MOCK_RUNS];
  private patterns: LearnedPattern[] = [...INITIAL_MOCK_PATTERNS];
  private health: HealthResponse = { ...MOCK_HEALTH };

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await simulateLatency(350, 500);

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase().trim()
    );

    if (!user || credentials.password !== MOCK_PASSWORD) {
      const error = new Error('Invalid email or password');
      (error as unknown as { status: number }).status = 401;
      throw error;
    }

    const token = `mock-token-${user.id}-${Date.now()}`;
    tokenStorage.setToken(token);
    tokenStorage.setUser(user);

    return {
      access_token: token,
      token_type: 'bearer',
      user,
    };
  }

  async getMe(): Promise<User> {
    await simulateLatency(200, 350);
    const storedUser = tokenStorage.getUser<User>();
    if (!storedUser) {
      const error = new Error('Not authenticated');
      (error as unknown as { status: number }).status = 401;
      throw error;
    }
    return storedUser;
  }

  async getRuns(): Promise<Run[]> {
    await simulateLatency(250, 450);
    // Return shallow copy without heavy sub-objects for list view
    return this.runs.map(({ drift_report: _, patch: __, pull_request: ___, ...run }) => ({
      ...run,
    }));
  }

  async getRun(id: string): Promise<RunDetail> {
    await simulateLatency(250, 400);
    const run = this.runs.find((r) => r.id === id);
    if (!run) {
      const error = new Error(`Run not found: ${id}`);
      (error as unknown as { status: number }).status = 404;
      throw error;
    }
    return { ...run };
  }

  async approveRun(id: string): Promise<ApproveResponse> {
    await simulateLatency(400, 600);
    const runIndex = this.runs.findIndex((r) => r.id === id);
    if (runIndex === -1) {
      const error = new Error(`Run not found: ${id}`);
      (error as unknown as { status: number }).status = 404;
      throw error;
    }

    const currentRun = this.runs[runIndex];
    const updatedPr = {
      url: `https://github.com/driftsmith-demo/${currentRun.service_name}/pull/104`,
      branch: currentRun.pull_request?.branch || `fix/drift-${currentRun.scenario}`,
      status: 'open' as const,
      dry_run: false,
    };

    const updatedRun: RunDetail = {
      ...currentRun,
      status: 'approved',
      pull_request: updatedPr,
    };

    this.runs[runIndex] = updatedRun;

    return {
      status: 'approved',
      pull_request: updatedPr,
    };
  }

  async getPatterns(): Promise<LearnedPattern[]> {
    await simulateLatency(250, 400);
    return [...this.patterns];
  }

  async triggerDrift(request: TriggerDriftRequest): Promise<TriggerDriftResponse> {
    await simulateLatency(350, 500);
    const { scenario, service_name } = request;
    const scenarioData = DRIFT_SCENARIOS[scenario] || DRIFT_SCENARIOS.rename;

    // Check key demo moment: service "target-app-b" heals instantly from memory!
    const isMemoryHealed =
      service_name.trim().toLowerCase() === 'target-app-b' ||
      service_name.trim().toLowerCase().includes('target-app-b');

    const runId = `run-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newRun: RunDetail = {
      id: runId,
      scenario,
      service_name: service_name || 'payment-gateway',
      source: 'manual',
      status: 'running',
      confidence: isMemoryHealed ? 0.99 : scenarioData.driftReport.changes[0]?.confidence || 0.95,
      verified: true,
      healed_from_memory: isMemoryHealed,
      llm_calls: isMemoryHealed ? 0 : scenario === 'type' ? 4 : 3,
      iterations: isMemoryHealed ? 1 : scenario === 'type' ? 2 : 1,
      started_at: nowIso,
      finished_at: null,
      drift_report: scenarioData.driftReport,
      patch: scenarioData.patch,
      pull_request: {
        url: null,
        branch: isMemoryHealed
          ? `fix/memory-heal-${service_name}`
          : `fix/drift-${scenario}-${service_name}`,
        status: 'dry_run',
        dry_run: true,
      },
    };

    // Prepend to top of runs list
    this.runs.unshift(newRun);

    // Register with mockStream
    registerMockRunForStream(
      runId,
      scenario,
      isMemoryHealed,
      scenarioData.driftReport.fingerprint
    );

    // Schedule status transition to 'awaiting_approval' matching mockStream timeline duration
    const streamDurationMs = isMemoryHealed ? 5200 : scenario === 'type' ? 22000 : 20000;
    setTimeout(() => {
      const idx = this.runs.findIndex((r) => r.id === runId);
      if (idx !== -1) {
        this.runs[idx] = {
          ...this.runs[idx],
          status: 'awaiting_approval',
          finished_at: new Date().toISOString(),
        };

        // Record or increment pattern usage in memory
        if (isMemoryHealed) {
          const patIdx = this.patterns.findIndex(
            (p) => p.fingerprint === scenarioData.driftReport.fingerprint
          );
          if (patIdx !== -1) {
            this.patterns[patIdx].times_used += 1;
          }
        }
      }
    }, streamDurationMs);

    return { run_id: runId };
  }

  async getHealth(): Promise<HealthResponse> {
    await simulateLatency(200, 350);
    return { ...this.health };
  }
}

export const mockClient = new MockClient();
