// Event sequence template for instant memory-healed remediation runs.
// Simulates zero-AI-call instant pattern matching in ~5 seconds.

import { EventStepTemplate } from './types';

export function buildMemoryHealedSequence(_fingerprint: string): EventStepTemplate[] {
  return [
    {
      agent: 'system',
      friendlyRole: 'Coordinator',
      kind: 'info',
      message: '1. API changed: Second payment app received changed API data.',
      delayMs: 400,
      storyStep: 1,
    },
    {
      agent: 'sentinel',
      friendlyRole: 'Detector',
      kind: 'thought',
      message: 'Detector is checking if DriftSmith has seen this exact problem before...',
      delayMs: 600,
      storyStep: 1,
    },
    {
      agent: 'memory',
      friendlyRole: 'Memory',
      kind: 'success',
      message: '2. Instant fix from memory: DriftSmith remembers this fix from earlier! Skipping AI code writing.',
      delayMs: 900,
      storyStep: 3,
      technicalDetails: { zero_ai_calls: true, source: 'remembered_fix_cache' },
    },
    {
      agent: 'verifier',
      friendlyRole: 'Tester',
      kind: 'thought',
      message: '4. Fix tested: Checking the remembered fix in the safe test room...',
      delayMs: 900,
      storyStep: 4,
    },
    {
      agent: 'verifier',
      friendlyRole: 'Tester',
      kind: 'success',
      message: 'Tests passed! Works with both OLD data and NEW data (38ms).',
      delayMs: 800,
      storyStep: 4,
      technicalDetails: { old_data: 'passed', new_data: 'passed', duration_ms: 38 },
    },
    {
      agent: 'pr',
      friendlyRole: 'Reporter',
      kind: 'action',
      message: '5. Ready for your approval: Instant pull request preview prepared in ~5 seconds with 0 AI calls.',
      delayMs: 700,
      storyStep: 5,
      technicalDetails: { branch: 'driftsmith/fix-second-payment-app-memory', preview: true },
    },
    {
      agent: 'system',
      friendlyRole: 'Coordinator',
      kind: 'info',
      message: 'run_finished',
      delayMs: 400,
      storyStep: 5,
    },
  ];
}
