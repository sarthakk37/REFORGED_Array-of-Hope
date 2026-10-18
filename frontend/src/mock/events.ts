// Plain-English event timeline fixtures and step definitions for DriftSmith runs.
// Agents are presented with friendly roles: Detector, Investigator, Code writer, Reviewer, Tester, Reporter.

import { RunEvent, Scenario } from '@/api/types';

export interface EventStepTemplate {
  agent: RunEvent['agent'];
  friendlyRole: string;
  kind: RunEvent['kind'];
  message: string;
  delayMs: number;
  storyStep: number; // 1: API changed, 2: Problem found, 3: Fix written, 4: Fix tested, 5: Ready for approval
  isRetry?: boolean;
  technicalDetails?: Record<string, unknown>;
}

/**
 * Builds the event progression sequence for a fresh run (~20-22 seconds total).
 */
export function buildFreshRunSequence(scenario: Scenario): EventStepTemplate[] {
  if (scenario === 'type') {
    return [
      {
        agent: 'system',
        friendlyRole: 'Coordinator',
        kind: 'info',
        message: '1. API changed: Payment provider sent updated payment data with changed schema.',
        delayMs: 600,
        storyStep: 1,
        technicalDetails: { scenario: 'type_changed', endpoint: '/webhook/payment' },
      },
      {
        agent: 'sentinel',
        friendlyRole: 'Detector',
        kind: 'thought',
        message: 'Detector is examining the failing payment payload...',
        delayMs: 1400,
        storyStep: 1,
      },
      {
        agent: 'sentinel',
        friendlyRole: 'Detector',
        kind: 'success',
        message: '2. Problem found: Payment provider silently changed the price format in its payload.',
        delayMs: 1600,
        storyStep: 2,
        technicalDetails: { expected: 'integer paise (49900)', received: 'string rupees ("499.00")' },
      },
      {
        agent: 'triage',
        friendlyRole: 'Investigator',
        kind: 'thought',
        message: 'Investigator diagnosed: your app expects integer 49900, but received decimal string "499.00".',
        delayMs: 1800,
        storyStep: 2,
        technicalDetails: { field: 'payment.amount', type_from: 'int', type_to: 'str', confidence: 0.96 },
      },
      {
        agent: 'locator',
        friendlyRole: 'Code writer',
        kind: 'action',
        message: 'Code writer located the amount parser in services/payment_webhook.py:28.',
        delayMs: 1600,
        storyStep: 3,
        technicalDetails: { file: 'services/payment_webhook.py', line: 28 },
      },
      {
        agent: 'coder',
        friendlyRole: 'Code writer',
        kind: 'thought',
        message: '3. Fix written: Drafted a code change that converts string amounts back to integer paise.',
        delayMs: 2000,
        storyStep: 3,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'action',
        message: '4. Fix tested: Running tests in safe test room...',
        delayMs: 1800,
        storyStep: 4,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'error',
        message: 'Safe test room test 1 failed: Direct float conversion lost precision on decimal string "499.00".',
        delayMs: 2000,
        storyStep: 4,
        isRetry: true,
        technicalDetails: { error: 'PrecisionTruncationError in test_decimal_string_amount_rupees' },
      },
      {
        agent: 'critic',
        friendlyRole: 'Reviewer',
        kind: 'thought',
        message: 'Reviewer explained: Direct float conversion drops cents; use round(float * 100) after sanitizing strings.',
        delayMs: 2200,
        storyStep: 4,
        isRetry: true,
        technicalDetails: { advice: 'Coerce string with clean replace and round to prevent IEEE 754 precision issues' },
      },
      {
        agent: 'coder',
        friendlyRole: 'Code writer',
        kind: 'action',
        message: 'Code writer updated the fix following the Reviewer advice.',
        delayMs: 2000,
        storyStep: 3,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'thought',
        message: 'Re-running tests in safe test room with the corrected fix...',
        delayMs: 1800,
        storyStep: 4,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'success',
        message: 'Tests passed! Works with both the OLD data (31ms) and the NEW data (34ms).',
        delayMs: 2200,
        storyStep: 4,
        technicalDetails: { old_data_test: 'passed', new_data_test: 'passed', regressions: 0 },
      },
      {
        agent: 'pr',
        friendlyRole: 'Reporter',
        kind: 'action',
        message: '5. Ready for your approval: Created a proposed pull request preview for your team.',
        delayMs: 1800,
        storyStep: 5,
        technicalDetails: { branch: 'driftsmith/fix-price-format-payment-app', preview: true },
      },
      {
        agent: 'system',
        friendlyRole: 'Coordinator',
        kind: 'info',
        message: 'run_finished',
        delayMs: 800,
        storyStep: 5,
      },
    ];
  }

  if (scenario === 'rename') {
    return [
      {
        agent: 'system',
        friendlyRole: 'Coordinator',
        kind: 'info',
        message: '1. API changed: Payment provider sent updated payment payload.',
        delayMs: 600,
        storyStep: 1,
      },
      {
        agent: 'sentinel',
        friendlyRole: 'Detector',
        kind: 'thought',
        message: 'Detector is inspecting the failing payload...',
        delayMs: 1400,
        storyStep: 1,
      },
      {
        agent: 'sentinel',
        friendlyRole: 'Detector',
        kind: 'success',
        message: '2. Problem found: Field amount_in_cents was renamed to total_amount.',
        delayMs: 1600,
        storyStep: 2,
        technicalDetails: { from: 'amount_in_cents', to: 'total_amount', confidence: 0.98 },
      },
      {
        agent: 'triage',
        friendlyRole: 'Investigator',
        kind: 'thought',
        message: 'Investigator diagnosed: your app expects amount_in_cents, but the provider now sends total_amount.',
        delayMs: 1600,
        storyStep: 2,
        technicalDetails: { from: 'amount_in_cents', to: 'total_amount', confidence: 0.98 },
      },
      {
        agent: 'locator',
        friendlyRole: 'Code writer',
        kind: 'action',
        message: 'Code writer located handler at services/payment_webhook.py:17.',
        delayMs: 1600,
        storyStep: 3,
      },
      {
        agent: 'coder',
        friendlyRole: 'Code writer',
        kind: 'thought',
        message: '3. Fix written: Code updated to read total_amount while still accepting amount_in_cents.',
        delayMs: 2000,
        storyStep: 3,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'action',
        message: '4. Fix tested: Running tests in safe test room...',
        delayMs: 1800,
        storyStep: 4,
      },
      {
        agent: 'verifier',
        friendlyRole: 'Tester',
        kind: 'success',
        message: 'Tests passed! Works with both the OLD data (24ms) and the NEW data (28ms).',
        delayMs: 2200,
        storyStep: 4,
        technicalDetails: { old_data_test: 'passed', new_data_test: 'passed' },
      },
      {
        agent: 'pr',
        friendlyRole: 'Reporter',
        kind: 'action',
        message: '5. Ready for your approval: Created a proposed pull request preview for your team.',
        delayMs: 1800,
        storyStep: 5,
        technicalDetails: { branch: 'driftsmith/fix-renamed-field-payment-app', preview: true },
      },
      {
        agent: 'system',
        friendlyRole: 'Coordinator',
        kind: 'info',
        message: 'run_finished',
        delayMs: 800,
        storyStep: 5,
      },
    ];
  }

  // Nested scenario (Email moved)
  return [
    {
      agent: 'system',
      friendlyRole: 'Coordinator',
      kind: 'info',
      message: '1. API changed: Payment provider updated payload customer structure.',
      delayMs: 600,
      storyStep: 1,
    },
    {
      agent: 'sentinel',
      friendlyRole: 'Detector',
      kind: 'thought',
      message: 'Detector is inspecting the nested payload...',
      delayMs: 1400,
      storyStep: 1,
    },
    {
      agent: 'sentinel',
      friendlyRole: 'Detector',
      kind: 'success',
      message: '2. Problem found: Email field was moved from customer.email to payer.contact.email.',
      delayMs: 1600,
      storyStep: 2,
      technicalDetails: { from: 'customer.email', to: 'payer.contact.email', confidence: 0.94 },
    },
    {
      agent: 'triage',
      friendlyRole: 'Investigator',
      kind: 'thought',
      message: 'Investigator diagnosed: customer.email was relocated to payer.contact.email.',
      delayMs: 1600,
      storyStep: 2,
      technicalDetails: { from: 'customer.email', to: 'payer.contact.email', confidence: 0.94 },
    },
    {
      agent: 'locator',
      friendlyRole: 'Code writer',
      kind: 'action',
      message: 'Code writer located customer receipt helper in services/payment_webhook.py:42.',
      delayMs: 1600,
      storyStep: 3,
    },
    {
      agent: 'coder',
      friendlyRole: 'Code writer',
      kind: 'thought',
      message: '3. Fix written: Code updated to check payer.contact.email first, with fallback to customer.email.',
      delayMs: 2000,
      storyStep: 3,
    },
    {
      agent: 'verifier',
      friendlyRole: 'Tester',
      kind: 'action',
      message: '4. Fix tested: Running tests in safe test room...',
      delayMs: 1800,
      storyStep: 4,
    },
    {
      agent: 'verifier',
      friendlyRole: 'Tester',
      kind: 'success',
      message: 'Tests passed! Works with both the OLD data (22ms) and the NEW data (26ms).',
      delayMs: 2000,
      storyStep: 4,
      technicalDetails: { old_data_test: 'passed', new_data_test: 'passed' },
    },
    {
      agent: 'pr',
      friendlyRole: 'Reporter',
      kind: 'action',
      message: '5. Ready for your approval: Created a proposed pull request preview for your team.',
      delayMs: 1800,
      storyStep: 5,
      technicalDetails: { branch: 'driftsmith/fix-moved-email-payment-app', preview: true },
    },
    {
      agent: 'system',
      friendlyRole: 'Coordinator',
      kind: 'info',
      message: 'run_finished',
      delayMs: 800,
      storyStep: 5,
    },
  ];
}

/**
 * Builds the instant memory-healed sequence (0 AI calls, ~5 seconds total).
 */
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
