// Test fixtures and helpers for smoke integration tests.

import { RunDetail } from '@/api/types';
import { DRIFT_SCENARIOS } from '@/mock/drifts';

export const mockSmokeRun: RunDetail = {
  id: 'run-smoke-view',
  scenario: 'type',
  service_name: 'Payment app',
  source: 'manual',
  status: 'awaiting_approval',
  confidence: 0.98,
  verified: true,
  healed_from_memory: false,
  llm_calls: 3,
  iterations: 1,
  started_at: '2026-10-18T10:00:00Z',
  finished_at: '2026-10-18T10:00:15Z',
  drift_report: DRIFT_SCENARIOS.type.driftReport,
  patch: DRIFT_SCENARIOS.type.patch,
  pull_request: null,
};
