// Event timeline fixtures and step definitions for DriftSmith runs.
// Simulates multi-agent reasoning, code localization, sandboxing, and PR generation.

import { RunEvent, Scenario } from '@/api/types';

export interface EventStepTemplate {
  agent: RunEvent['agent'];
  kind: RunEvent['kind'];
  message: string;
  delayMs: number;
  payload?: Record<string, unknown>;
}

/**
 * Builds the event progression sequence for a fresh LLM-based drift resolution run (~20-22 seconds total).
 */
export function buildFreshRunSequence(scenario: Scenario): EventStepTemplate[] {
  const commonHeader: EventStepTemplate[] = [
    {
      agent: 'system',
      kind: 'info',
      message: 'Self-healing orchestrator initiated run sequence.',
      delayMs: 600,
      payload: { mode: 'autonomous', pipeline_version: '1.2.0' },
    },
    {
      agent: 'sentinel',
      kind: 'thought',
      message: 'Ingesting failing webhook payload from incoming error stream...',
      delayMs: 1400,
    },
    {
      agent: 'sentinel',
      kind: 'success',
      message: 'Detected schema drift: Payload schema diverged from stored contract specification.',
      delayMs: 1600,
      payload: { divergence_score: 0.94 },
    },
    {
      agent: 'memory',
      kind: 'info',
      message: 'Checking pattern memory cache for matching schema fingerprint...',
      delayMs: 1000,
    },
    {
      agent: 'memory',
      kind: 'warning',
      message: 'No exact fingerprint match found in local pattern memory. Escalating to LLM synthesis tier.',
      delayMs: 1200,
    },
    {
      agent: 'triage',
      kind: 'thought',
      message: 'Analyzing syntactic differences between expected schema and mutated payload...',
      delayMs: 1800,
    },
  ];

  if (scenario === 'rename') {
    return [
      ...commonHeader,
      {
        agent: 'triage',
        kind: 'success',
        message: 'Identified renamed key: `amount_in_cents` moved to `total_amount` (Confidence: 98%).',
        delayMs: 1800,
        payload: { confidence: 0.98, key_from: 'amount_in_cents', key_to: 'total_amount' },
      },
      {
        agent: 'locator',
        kind: 'action',
        message: 'Scanning AST: Located handler site in `services/payment_webhook.py:17`.',
        delayMs: 1600,
        payload: { file: 'services/payment_webhook.py', line: 17 },
      },
      {
        agent: 'coder',
        kind: 'thought',
        message: 'Synthesizing dual-compatibility patch to support both total_amount and amount_in_cents...',
        delayMs: 2200,
      },
      {
        agent: 'coder',
        kind: 'action',
        message: 'Emitted backward-compatible patch hunk for `services/payment_webhook.py`.',
        delayMs: 1800,
      },
      {
        agent: 'verifier',
        kind: 'thought',
        message: 'Spinning up isolated sandbox container to run dual payload test suite...',
        delayMs: 2000,
      },
      {
        agent: 'verifier',
        kind: 'success',
        message: 'Sandbox tests passed: Old payload PASS (24ms) | New payload PASS (28ms).',
        delayMs: 2200,
        payload: { tests_passed: 2, total_tests: 2 },
      },
      {
        agent: 'pr',
        kind: 'action',
        message: 'Generated dry-run pull request branch: `fix/drift-amount-in-cents-rename`.',
        delayMs: 1800,
        payload: { branch: 'fix/drift-amount-in-cents-rename', dry_run: true },
      },
      {
        agent: 'system',
        kind: 'info',
        message: 'run_finished',
        delayMs: 800,
      },
    ];
  }

  if (scenario === 'type') {
    return [
      ...commonHeader,
      {
        agent: 'triage',
        kind: 'success',
        message: 'Identified type mutation: Integer paise converted to decimal string rupees (Confidence: 96%).',
        delayMs: 1800,
        payload: { confidence: 0.96, expected: 'int (paise)', actual: 'str ("499.00")' },
      },
      {
        agent: 'locator',
        kind: 'action',
        message: 'Scanning AST: Located currency parser in `services/payment_webhook.py:28`.',
        delayMs: 1600,
        payload: { file: 'services/payment_webhook.py', line: 28 },
      },
      {
        agent: 'coder',
        kind: 'thought',
        message: 'Drafting initial type cast parser for `parse_charge_amount`...',
        delayMs: 2000,
      },
      {
        agent: 'verifier',
        kind: 'action',
        message: 'Executing sandbox test suite against initial patch candidate...',
        delayMs: 1800,
      },
      {
        agent: 'verifier',
        kind: 'error',
        message: 'Sandbox verification failed: Decimal string "499.00" caused float precision truncation error in test_decimal_string_amount_rupees.',
        delayMs: 2000,
        payload: { failed_test: 'test_decimal_string_amount_rupees', exit_code: 1 },
      },
      {
        agent: 'critic',
        kind: 'thought',
        message: 'Evaluating failure trace: Direct float casting suffers precision loss. Advising round(float * 100) with string sanitization.',
        delayMs: 2200,
      },
      {
        agent: 'coder',
        kind: 'action',
        message: 'Refactoring patch with Critic feedback: Added clean string sanitization and exact integer rounding.',
        delayMs: 2000,
      },
      {
        agent: 'verifier',
        kind: 'thought',
        message: 'Re-running sandbox test suite against refined patch candidate...',
        delayMs: 1800,
      },
      {
        agent: 'verifier',
        kind: 'success',
        message: 'Sandbox verification PASSED: Integer paise PASS (31ms) | Decimal string PASS (34ms).',
        delayMs: 2200,
        payload: { tests_passed: 2, total_tests: 2, retries: 1 },
      },
      {
        agent: 'pr',
        kind: 'action',
        message: 'Generated dry-run pull request branch: `fix/drift-amount-type-coercion`.',
        delayMs: 1800,
        payload: { branch: 'fix/drift-amount-type-coercion', dry_run: true },
      },
      {
        agent: 'system',
        kind: 'info',
        message: 'run_finished',
        delayMs: 800,
      },
    ];
  }

  // Nested scenario
  return [
    ...commonHeader,
    {
      agent: 'triage',
      kind: 'success',
      message: 'Identified path restructure: `customer.email` relocated to `payer.contact.email` (Confidence: 94%).',
      delayMs: 1800,
      payload: { confidence: 0.94, old_path: 'customer.email', new_path: 'payer.contact.email' },
    },
    {
      agent: 'locator',
      kind: 'action',
      message: 'Scanning AST: Located nested customer accessor in `services/payment_webhook.py:42`.',
      delayMs: 1600,
    },
    {
      agent: 'coder',
      kind: 'thought',
      message: 'Generating fallback dictionary traversal with safe null-coalescing...',
      delayMs: 2000,
    },
    {
      agent: 'coder',
      kind: 'action',
      message: 'Emitted safe hierarchical accessor patch.',
      delayMs: 1800,
    },
    {
      agent: 'verifier',
      kind: 'thought',
      message: 'Dispatching sandbox tests for nested payload variations...',
      delayMs: 1800,
    },
    {
      agent: 'verifier',
      kind: 'success',
      message: 'Sandbox verification PASSED: Legacy flat format PASS (22ms) | Nested format PASS (26ms).',
      delayMs: 2000,
      payload: { tests_passed: 2, total_tests: 2 },
    },
    {
      agent: 'pr',
      kind: 'action',
      message: 'Generated dry-run pull request branch: `fix/drift-nested-customer-path`.',
      delayMs: 1800,
      payload: { branch: 'fix/drift-nested-customer-path', dry_run: true },
    },
    {
      agent: 'system',
      kind: 'info',
      message: 'run_finished',
      delayMs: 800,
    },
  ];
}

/**
 * Builds the rapid memory-healed event sequence (0 LLM calls, ~4-5 seconds total).
 */
export function buildMemoryHealedSequence(fingerprint: string): EventStepTemplate[] {
  return [
    {
      agent: 'system',
      kind: 'info',
      message: 'Self-healing orchestrator initiated run sequence.',
      delayMs: 400,
    },
    {
      agent: 'sentinel',
      kind: 'thought',
      message: 'Ingesting failing webhook payload from target service...',
      delayMs: 600,
    },
    {
      agent: 'sentinel',
      kind: 'success',
      message: 'Detected schema drift: Computed payload fingerprint.',
      delayMs: 600,
    },
    {
      agent: 'memory',
      kind: 'thought',
      message: `Querying pattern memory store for fingerprint ${fingerprint}...`,
      delayMs: 600,
    },
    {
      agent: 'memory',
      kind: 'success',
      message: 'PATTERN CACHE HIT: Exact matching patch recipe found in learned memory. Skipping LLM synthesis!',
      delayMs: 800,
      payload: { zero_llm_call: true, cached_recipe_id: 'pat-901' },
    },
    {
      agent: 'verifier',
      kind: 'thought',
      message: 'Executing fast verification in sandbox to ensure zero regressions against local codebase...',
      delayMs: 900,
    },
    {
      agent: 'verifier',
      kind: 'success',
      message: 'Sandbox tests validated cached patch: 2 tests passed (42ms total).',
      delayMs: 800,
      payload: { verified: true },
    },
    {
      agent: 'pr',
      kind: 'action',
      message: 'Applied cached patch recipe to pull request branch: `fix/memory-heal-target-app-b`.',
      delayMs: 600,
      payload: { branch: 'fix/memory-heal-target-app-b', dry_run: true },
    },
    {
      agent: 'system',
      kind: 'info',
      message: 'run_finished',
      delayMs: 400,
    },
  ];
}
