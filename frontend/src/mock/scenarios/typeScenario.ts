// Scenario fixture for "Price format changed" (Type change).
// Simulates Razorpay/Stripe changing amount from integer paise (49900) to string rupees ("499.00").

import { DriftScenarioData } from './types';

export const typeScenario: DriftScenarioData = {
  scenario: 'type',
  title: 'Price format changed',
  technicalName: 'Type change',
  description: 'Amount changed from integer paise (49900) to decimal string in rupees ("499.00").',
  plainCaption:
    'The provider changed amount from an integer in paise (49900) to a decimal string in rupees ("499.00"). Your app expects an integer, so it breaks.',
  diffPlainCaption:
    'Works with both old and new data: safely turns string rupees ("499.00") into integer paise (49900) while keeping integer inputs working.',
  oldPayloadJson: JSON.stringify(
    {
      event: 'payment.succeeded',
      payment: {
        id: 'pay_982184',
        amount: 49900,
        currency: 'INR',
      },
    },
    null,
    2
  ),
  newPayloadJson: JSON.stringify(
    {
      event: 'payment.succeeded',
      payment: {
        id: 'pay_982184',
        amount: '499.00',
        currency: 'INR',
      },
    },
    null,
    2
  ),
  driftReport: {
    fingerprint: 'fp_type_amount_str_decimal_44c1',
    summary: 'Provider changed amount from an integer (paise) to a decimal string (rupees).',
    risk: 'high',
    changes: [
      {
        type: 'type_changed',
        path: 'payment.amount',
        from: '49900 (integer paise)',
        to: '"499.00" (decimal string rupees)',
        confidence: 0.96,
      },
    ],
  },
  patch: {
    diff_text: `--- a/services/payment_webhook.py
+++ b/services/payment_webhook.py
@@ -28,5 +28,12 @@ def parse_charge_amount(raw_amount) -> int:
     """Ensure amount is normalized into integer cents/paise."""
-    return int(raw_amount)
+    if isinstance(raw_amount, (int, float)):
+        return int(raw_amount)
+    if isinstance(raw_amount, str):
+        # Handle decimal string in major currency units (e.g. "499.00" -> 49900)
+        cleaned = raw_amount.replace(",", "").strip()
+        return int(round(float(cleaned) * 100))
+    raise ValueError(f"Unsupported amount format: {raw_amount}")`,
    plan_summary:
      'Turn string rupees into integer paise with decimal scaling, keeping old integers working.',
    verified: true,
    test_results: [
      {
        name: 'test_integer_amount_paise',
        payload_version: 'old',
        passed: true,
        duration_ms: 31,
        output: 'PASS: Verified integer 49900 continues working without changes.',
      },
      {
        name: 'test_decimal_string_amount_rupees',
        payload_version: 'new',
        passed: true,
        duration_ms: 34,
        output: 'PASS: Verified decimal string "499.00" scales accurately to 49900 paise.',
      },
    ],
    sandbox_log: `[safe-test-room:setup] Preparing test room: python-3.11-runner
[safe-test-room:attempt-1] Attempt 1 failed: Reviewer caught decimal float truncation.
[safe-test-room:reviewer-feedback] Reviewer note: round(float * 100) prevents precision loss.
[safe-test-room:attempt-2] Attempt 2 with corrected fix:
test_integer_amount_paise PASSED
test_decimal_string_amount_rupees PASSED
============================== 2 passed in 0.07s ==============================
[safe-test-room:summary] Both old data and new data tests passed safely.`,
  },
};
