// System health and subsystem integration status for DriftSmith.
// Strictly honest telemetry without fabricated production claims.

import { HealthResponse } from '@/api/types';

export const MOCK_HEALTH: HealthResponse = {
  status: 'ok',
  llm_mode: 'mock',
  auth_enabled: true,
  integrations: [
    {
      name: 'database',
      status: 'live',
      detail: 'SQLite (demo)',
    },
    {
      name: 'llm',
      status: 'live',
      detail: 'Gemma via Gemini API - mock mode',
    },
    {
      name: 'github',
      status: 'dry_run',
      detail: 'Dry run - pull requests are previewed, not created',
    },
    {
      name: 'slack',
      status: 'disabled',
      detail: 'Not connected',
    },
    {
      name: 'sandbox',
      status: 'live',
      detail: 'Simulated in demo mode',
    },
    {
      name: 'n8n',
      status: 'disabled',
      detail: 'Coming in next phase',
    },
  ],
};
