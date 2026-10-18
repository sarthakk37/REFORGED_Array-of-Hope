// In-memory Mock implementation of ApiClient backed by mockStore.
// Guarantees zero-network approval, truthful metrics, and dynamic pattern retention.

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
import { DRIFT_SCENARIOS } from '@/mock/drifts';
import { mockStore } from '@/mock/mockStore';
import { registerMockRunForStream } from './mockStream';
import { tokenStorage } from '@/auth/tokenStorage';

const simulateLatency = (min = 150, max = 300): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export class MockClient implements ApiClient {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await simulateLatency(150, 300);

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
    await simulateLatency(100, 200);
    const storedUser = tokenStorage.getUser<User>();
    if (!storedUser) {
      const error = new Error('Not authenticated');
      (error as unknown as { status: number }).status = 401;
      throw error;
    }
    return storedUser;
  }

  async getRuns(): Promise<Run[]> {
    await simulateLatency(100, 250);
    return mockStore.getRuns().map(({ drift_report: _, patch: __, pull_request: ___, ...run }) => ({
      ...run,
    }));
  }

  async getRun(id: string): Promise<RunDetail> {
    await simulateLatency(100, 200);
    const run = mockStore.getRun(id);
    if (!run) {
      const error = new Error(`Run not found: ${id}`);
      (error as unknown as { status: number }).status = 404;
      throw error;
    }
    return { ...run };
  }

  async approveRun(id: string): Promise<ApproveResponse> {
    await simulateLatency(200, 350);
    const run = mockStore.getRun(id);
    if (!run) {
      const error = new Error(`Run not found: ${id}`);
      (error as unknown as { status: number }).status = 404;
      throw error;
    }

    // Mock mode rule: Never call network or GitHub. Set status to approved with dry_run PR preview.
    const updatedPr = {
      url: null,
      branch: `driftsmith/fix-${run.id}`,
      status: 'dry_run' as const,
      dry_run: true,
    };

    mockStore.updateRun(id, {
      status: 'approved',
      pull_request: updatedPr,
    });

    return {
      status: 'approved',
      pull_request: updatedPr,
    };
  }

  async getPatterns(): Promise<LearnedPattern[]> {
    await simulateLatency(100, 200);
    return mockStore.getPatterns();
  }

  async triggerDrift(request: TriggerDriftRequest): Promise<TriggerDriftResponse> {
    await simulateLatency(200, 300);
    const { scenario, service_name } = request;
    const scenarioData = DRIFT_SCENARIOS[scenario] || DRIFT_SCENARIOS.type;

    const isSecondApp =
      service_name.toLowerCase().includes('second') ||
      service_name.toLowerCase().includes('target-app-b');

    // Rule: Second app only heals from memory if a remembered fix already exists for this scenario!
    const hasRememberedFix = mockStore.hasPatternForScenario(scenario);
    const isMemoryHealed = isSecondApp && hasRememberedFix;

    const runId = `run-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newRun: RunDetail = {
      id: runId,
      scenario,
      service_name: service_name || 'Payment app',
      source: 'manual',
      status: 'running',
      confidence: isMemoryHealed ? 0.99 : scenarioData.driftReport.changes[0]?.confidence || 0.96,
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
        branch: `driftsmith/fix-${runId}`,
        status: 'dry_run',
        dry_run: true,
      },
    };

    mockStore.addRun(newRun);

    // Register with mockStream
    registerMockRunForStream(runId, scenario, isMemoryHealed, scenarioData.driftReport.fingerprint);

    // Schedule status transition to awaiting_approval matching mockStream
    const streamDurationMs = isMemoryHealed ? 5200 : scenario === 'type' ? 22000 : 20000;
    setTimeout(() => {
      mockStore.updateRun(runId, {
        status: 'awaiting_approval',
        finished_at: new Date().toISOString(),
      });

      if (isMemoryHealed) {
        mockStore.incrementPatternUsage(scenarioData.driftReport.fingerprint);
      } else if (scenario === 'type') {
        // First fix completed: Add to remembered fixes!
        mockStore.addRememberedFix('type');
      }
    }, streamDurationMs);

    return { run_id: runId };
  }

  async getHealth(): Promise<HealthResponse> {
    await simulateLatency(100, 200);
    return mockStore.getHealth();
  }
}

export const mockClient = new MockClient();
