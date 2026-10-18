// Typed guided demo script for the automated presenter walkthrough (Priya story).
// Defines the exact narrative steps, spoken audio text, visual triggers, and highlighted elements.

export type VisualActionType =
  | 'none'
  | 'trigger-type-payment-app'
  | 'approve-active-run'
  | 'trigger-type-second-app';

export interface PresenterScriptStep {
  stepId: string;
  title: string;
  spokenText: string;
  visualAction: VisualActionType;
  highlightElement?: string;
  visualDurationMs: number;
}

export const PRESENTER_SCRIPT: PresenterScriptStep[] = [
  {
    stepId: 'intro-priya',
    title: "1. Meet Priya's payment app",
    spokenText:
      "Meet Priya's payment app. It processes thousands of customer orders daily by reading transaction data from an external payment provider.",
    visualAction: 'none',
    highlightElement: '[data-testid="start-guided-demo-btn"]',
    visualDurationMs: 6000,
  },
  {
    stepId: 'api-break-triggered',
    title: '2. The provider changes their API without warning',
    spokenText:
      'The payment provider silently changes their API: prices are now sent as decimal strings in rupees instead of integer paise. Priya\'s app crashes.',
    visualAction: 'trigger-type-payment-app',
    highlightElement: '[data-testid="simulator-choice-type"]',
    visualDurationMs: 8000,
  },
  {
    stepId: 'drift-diagnosed',
    title: '3. DriftSmith diagnoses the exact break',
    spokenText:
      'DriftSmith intercepts the failure immediately. The Detector and Investigator pinpoint the exact schema difference and locate the failing lines in services/payment_webhook.py.',
    visualAction: 'none',
    highlightElement: '[data-testid="before-after-payload"]',
    visualDurationMs: 7000,
  },
  {
    stepId: 'code-written-review',
    title: '4. Code written & Reviewer catches a bug',
    spokenText:
      'The Code writer drafts a fix. But on the first safe test run, the Reviewer catches a floating-point precision error and explains the exact rounding correction needed.',
    visualAction: 'none',
    highlightElement: '[data-testid="remediation-diff"]',
    visualDurationMs: 7500,
  },
  {
    stepId: 'safe-test-passed',
    title: '5. Safe test room passes old AND new data',
    spokenText:
      'The Code writer corrects the fix. In the safe test room, the new code passes tests against BOTH the legacy payload and the new payload with zero regressions.',
    visualAction: 'none',
    highlightElement: '[data-testid="safe-test-results"]',
    visualDurationMs: 7000,
  },
  {
    stepId: 'human-approval-pr',
    title: '6. Ready for human sign-off',
    spokenText:
      'DriftSmith keeps humans in the loop. One click approves the verified fix and prepares a pull request preview with complete safety notes for Priya\'s team.',
    visualAction: 'approve-active-run',
    highlightElement: '[data-testid="pr-preview-card"]',
    visualDurationMs: 7500,
  },
  {
    stepId: 'memory-heal-second-app',
    title: '7. Second app has the same problem: Instant memory fix!',
    spokenText:
      'Now, a second team\'s app hits the exact same API change. DriftSmith remembers the verified recipe from earlier — fixing the issue instantly in ~5 seconds with 0 AI calls!',
    visualAction: 'trigger-type-second-app',
    highlightElement: '[data-testid="remediation-stage"]',
    visualDurationMs: 6500,
  },
  {
    stepId: 'summary-comparison',
    title: '8. Demonstration Summary',
    spokenText:
      'First fix: ~22s, 4 AI calls. Second app: ~5s, 0 AI calls. DriftSmith turns breaking third-party API changes into automatic, human-approved pull requests.',
    visualAction: 'none',
    highlightElement: '[data-testid="presenter-summary-card"]',
    visualDurationMs: 6000,
  },
];
