// Fixtures for the 3 demo API change scenarios: Price format changed, Field renamed, and Email moved.
// Contains side-by-side payloads, plain-English captions, unified diffs, and safe test results.

import { DriftReport, PatchInfo, Scenario } from '@/api/types';

export interface DriftScenarioData {
  scenario: Scenario;
  title: string;
  technicalName: string;
  description: string;
  plainCaption: string;
  diffPlainCaption: string;
  oldPayloadJson: string;
  newPayloadJson: string;
  driftReport: DriftReport;
  patch: PatchInfo;
}

export const DRIFT_SCENARIOS: Record<Scenario, DriftScenarioData> = {
  type: {
    scenario: 'type',
    title: 'Price format changed',
    technicalName: 'Type change',
    description: 'Amount changed from integer paise (49900) to decimal string in rupees ("499.00").',
    plainCaption: 'The provider changed amount from an integer in paise (49900) to a decimal string in rupees ("499.00"). Your app expects an integer, so it breaks.',
    diffPlainCaption: 'Works with both old and new data: safely turns string rupees ("499.00") into integer paise (49900) while keeping integer inputs working.',
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
      plan_summary: 'Turn string rupees into integer paise with decimal scaling, keeping old integers working.',
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
  },

  rename: {
    scenario: 'rename',
    title: 'Field renamed',
    technicalName: 'Field rename',
    description: 'Provider replaced `amount_in_cents` with `total_amount`.',
    plainCaption: 'The provider renamed amount_in_cents to total_amount. Your app still looks for the old name, so it breaks.',
    diffPlainCaption: 'Works with both old and new data: reads total_amount first, but still accepts amount_in_cents if older data arrives.',
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
      plan_summary: 'Inspect total_amount with fallback to amount_in_cents for full backward compatibility.',
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
  },

  nested: {
    scenario: 'nested',
    title: 'Email moved',
    technicalName: 'Object restructure',
    description: 'Customer email moved from `customer.email` to `payer.contact.email`.',
    plainCaption: 'The provider moved customer.email to payer.contact.email. Your app cannot find the customer email at the top level, so it breaks.',
    diffPlainCaption: 'Works with both old and new data: looks inside payer.contact.email first, and falls back to customer.email if needed.',
    oldPayloadJson: JSON.stringify(
      {
        event: 'charge.succeeded',
        customer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
      },
      null,
      2
    ),
    newPayloadJson: JSON.stringify(
      {
        event: 'charge.succeeded',
        payer: {
          contact: {
            email: 'jane@example.com',
          },
        },
      },
      null,
      2
    ),
    driftReport: {
      fingerprint: 'fp_nested_payer_contact_email_331a',
      summary: 'Provider moved email from customer.email to payer.contact.email.',
      risk: 'medium',
      changes: [
        {
          type: 'moved',
          path: 'customer.email',
          from: 'customer.email',
          to: 'payer.contact.email',
          confidence: 0.94,
        },
      ],
    },
    patch: {
      diff_text: `--- a/services/payment_webhook.py
+++ b/services/payment_webhook.py
@@ -42,3 +42,7 @@ def get_customer_receipt_email(payload: dict) -> str:
-    return payload.get("customer", {}).get("email", "")
+    # Check new nested path first, fall back to old path
+    nested_payer = payload.get("payer", {}).get("contact", {}).get("email")
+    legacy_customer = payload.get("customer", {}).get("email")
+    return (nested_payer or legacy_customer or "").strip()`,
      plan_summary: 'Read payer.contact.email with automatic fallback to customer.email.',
      verified: true,
      test_results: [
        {
          name: 'test_legacy_flat_customer_email',
          payload_version: 'old',
          passed: true,
          duration_ms: 22,
          output: 'PASS: Extracted jane@example.com from old customer.email path.',
        },
        {
          name: 'test_nested_payer_contact_email',
          payload_version: 'new',
          passed: true,
          duration_ms: 26,
          output: 'PASS: Extracted jane@example.com from new payer.contact.email path.',
        },
      ],
      sandbox_log: `[safe-test-room:setup] Preparing test room: python-3.11-runner
[safe-test-room:exec] Running tests against old and new payloads...
test_legacy_flat_customer_email PASSED
test_nested_payer_contact_email PASSED
============================== 2 passed in 0.04s ==============================
[safe-test-room:summary] Both old and new data paths validated.`,
    },
  },
};
