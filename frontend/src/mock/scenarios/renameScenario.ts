// Scenario fixture for "Field renamed" (Field rename).
// Simulates provider renaming amount_in_cents to total_amount in charge payloads.

import { DriftScenarioData } from './types';

export const renameScenario: DriftScenarioData = {
  scenario: 'rename',
  title: 'Field renamed',
  technicalName: 'Field rename',
  description: 'Provider replaced `amount_in_cents` with `total_amount`.',
  plainCaption:
    'The provider renamed amount_in_cents to total_amount. Your app still looks for the old name, so it breaks.',
  diffPlainCaption:
    'Works with both old and new data: reads total_amount first, but still accepts amount_in_cents if older data arrives.',
  oldPayloadJson: JSON.stringify(
    {
      event: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_77123',
          amount_in_cents: 49900,
          currency: 'USD',
        },
      },
    },
    null,
    2
  ),
  newPayloadJson: JSON.stringify(
    {
      event: 'charge.succeeded',
      data: {
        object: {
          id: 'ch_77123',
          total_amount: 49900,
          currency: 'USD',
        },
      },
    },
    null,
    2
  ),
  driftReport: {
    fingerprint: 'fp_rename_amount_in_cents_9b2e',
    summary: 'Provider renamed amount_in_cents to total_amount.',
    risk: 'medium',
    changes: [
      {
        type: 'renamed',
        path: 'event.data.object.amount_in_cents',
        from: 'amount_in_cents',
        to: 'total_amount',
        confidence: 0.98,
      },
    ],
  },
  patch: {
    diff_text: `--- a/services/payment_webhook.py
+++ b/services/payment_webhook.py
@@ -14,7 +14,8 @@ def handle_charge_succeeded(event_payload: dict) -> dict:
     event_id = event_payload.get("id")
     data = event_payload.get("data", {}).get("object", {})
     
-    amount_cents = data["amount_in_cents"]
+    # Self-healed: Support total_amount with fallback to amount_in_cents
+    amount_cents = data.get("total_amount", data.get("amount_in_cents", 0))
     currency = data.get("currency", "USD").lower()
     
     logger.info(f"Processing charge {event_id} for amount {amount_cents}")`,
    plan_summary:
      'Inspect total_amount with fallback to amount_in_cents for full backward compatibility.',
    verified: true,
    test_results: [
      {
        name: 'test_legacy_payload_ingestion',
        payload_version: 'old',
        passed: true,
        duration_ms: 24,
        output: 'PASS: Validated that old payloads with amount_in_cents still work.',
      },
      {
        name: 'test_mutated_payload_ingestion',
        payload_version: 'new',
        passed: true,
        duration_ms: 28,
        output: 'PASS: Validated that new payloads with total_amount work smoothly.',
      },
    ],
    sandbox_log: `[safe-test-room:setup] Preparing test room: python-3.11-runner
[safe-test-room:exec] Running tests against old and new payloads...
test_legacy_payload_ingestion PASSED
test_mutated_payload_ingestion PASSED
============================== 2 passed in 0.05s ==============================
[safe-test-room:summary] Verified backward and forward compatibility.`,
  },
};
