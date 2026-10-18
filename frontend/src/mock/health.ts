// System health and integration state fixtures for DriftSmith diagnostics.
// Used by SystemStatusPage and backend health probes.

import { HealthResponse } from '@/api/types';

export const MOCK_HEALTH: HealthResponse = {
  status: 'ok',
  llm_mode: 'mock',
  auth_enabled: true,
  integrations: [
    {
      name: 'database',
      status: 'live',
      detail: 'PostgreSQL connection pool healthy (12 active connections, 4ms latency).',
    },
    {
      name: 'llm',
      status: 'live',
      detail: 'Anthropic Claude 3.5 Sonnet connected with fallback routing enabled.',
    },
    {
      name: 'github',
      status: 'live',
      detail: 'GitHub App authenticated (Token permissions: PR write, commit read).',
    },
    {
      name: 'slack',
      status: 'live',
      detail: 'Incoming Webhook configured for channel #drift-alerts.',
    },
    {
      name: 'sandbox',
      status: 'live',
      detail: 'Docker socket connected; Python 3.11 isolation worker pool ready.',
    },
    {
      name: 'n8n',
      status: 'dry_run',
      detail: 'Workflow triggers operating in dry-run mode (telemetry captured).',
    },
  ],
};
