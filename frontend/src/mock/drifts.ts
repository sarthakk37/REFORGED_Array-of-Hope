// Fixtures for the 3 demo drift scenarios: rename, type, and nested schema shifts.
// Includes realistic unified diffs for Python payment handlers, drift reports, and sandbox test results.

import { DriftReport, PatchInfo, Scenario } from '@/api/types';

export interface DriftScenarioData {
  scenario: Scenario;
  title: string;
  description: string;
  driftReport: DriftReport;
  patch: PatchInfo;
}

export const DRIFT_SCENARIOS: Record<Scenario, DriftScenarioData> = {
  rename: {
    scenario: 'rename',
    title: 'Field Rename: amount_in_cents → total_amount',
    description: 'Payment provider upgraded API payload replacing legacy `amount_in_cents` key with `total_amount`.',
    driftReport: {
      fingerprint: 'fp_rename_amount_in_cents_9b2e',
      summary: 'Upstream payment payload schema mutated key `amount_in_cents` to `total_amount`.',
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
+    # Self-healed: Fallback to total_amount if amount_in_cents is missing
+    amount_cents = data.get("total_amount", data.get("amount_in_cents", 0))
     currency = data.get("currency", "USD").lower()
     
     logger.info(f"Processing charge {event_id} for amount {amount_cents}")`,
      plan_summary: 'Update charge ingestion to inspect `total_amount` while preserving backward compatibility for legacy `amount_in_cents` payloads.',
      verified: true,
      test_results: [
        {
          name: 'test_legacy_payload_ingestion',
          payload_version: 'old',
          passed: true,
          duration_ms: 24,
          output: 'PASS: Validated backward compatibility with legacy amount_in_cents payload structure.',
        },
        {
          name: 'test_mutated_payload_ingestion',
          payload_version: 'new',
          passed: true,
          duration_ms: 28,
          output: 'PASS: Successfully extracted total_amount and verified database ledger entry.',
        },
      ],
      sandbox_log: `[sandbox:setup] Isolated container created: py311-pytest-env
[sandbox:exec] pytest -v tests/test_payment_webhook.py
test_payment_webhook.py::test_legacy_payload_ingestion PASSED [ 50%]
test_payment_webhook.py::test_mutated_payload_ingestion PASSED [100%]
============================== 2 passed in 0.05s ==============================
[sandbox:verify] Both legacy and drifted schemas validated cleanly without regressions.`,
    },
  },

  type: {
    scenario: 'type',
    title: 'Type Shift: Integer paise to Decimal String Rupees ("499.00")',
    description: 'Provider silently altered amount unit from integer paise (49900) to formatted decimal string in rupees ("499.00").',
    driftReport: {
      fingerprint: 'fp_type_amount_str_decimal_44c1',
      summary: 'Type mismatch detected on `amount`: Expected int (paise), received string decimal (rupees).',
      risk: 'high',
      changes: [
        {
          type: 'type_changed',
          path: 'payload.payment.amount',
          from: 'int (49900)',
          to: 'str ("499.00")',
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
      plan_summary: 'Add robust type coercion with decimal scaling to normalize string rupees into integer paise, maintaining integer compatibility.',
      verified: true,
      test_results: [
        {
          name: 'test_integer_amount_paise',
          payload_version: 'old',
          passed: true,
          duration_ms: 31,
          output: 'PASS: Verified integer 49900 resolves to 49900 paise.',
        },
        {
          name: 'test_decimal_string_amount_rupees',
          payload_version: 'new',
          passed: true,
          duration_ms: 34,
          output: 'PASS: Verified decimal string "499.00" scales accurately to 49900 paise without floating point inaccuracy.',
        },
      ],
      sandbox_log: `[sandbox:setup] Isolated container created: py311-pytest-env
[sandbox:exec] Attempt 1 failed: Critic identified float truncation issue.
[sandbox:exec] Attempt 2: Re-running pytest tests/test_payment_types.py
test_payment_types.py::test_integer_amount_paise PASSED [ 50%]
test_payment_types.py::test_decimal_string_amount_rupees PASSED [100%]
============================== 2 passed in 0.07s ==============================
[sandbox:verify] Critic approved patch logic. Coercion and scaling verified.`,
    },
  },

  nested: {
    scenario: 'nested',
    title: 'Path Restructure: customer.email → payer.contact.email',
    description: 'Payer metadata relocated from top-level `customer` dictionary to deeply nested `payer.contact.email`.',
    driftReport: {
      fingerprint: 'fp_nested_payer_contact_email_331a',
      summary: 'Object hierarchy restructured: `customer.email` relocated to `payer.contact.email`.',
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
+    # Backward and forward compatible nested extraction
+    nested_payer = payload.get("payer", {}).get("contact", {}).get("email")
+    legacy_customer = payload.get("customer", {}).get("email")
+    return (nested_payer or legacy_customer or "").strip()`,
      plan_summary: 'Traverse nested `payer.contact.email` path with automatic fallback to legacy `customer.email`.',
      verified: true,
      test_results: [
        {
          name: 'test_legacy_flat_customer_email',
          payload_version: 'old',
          passed: true,
          duration_ms: 22,
          output: 'PASS: Extracted user@legacy.test from customer.email.',
        },
        {
          name: 'test_nested_payer_contact_email',
          payload_version: 'new',
          passed: true,
          duration_ms: 26,
          output: 'PASS: Extracted user@nested.test from payer.contact.email.',
        },
      ],
      sandbox_log: `[sandbox:setup] Isolated container created: py311-pytest-env
[sandbox:exec] pytest tests/test_nested_webhook.py
test_nested_webhook.py::test_legacy_flat_customer_email PASSED [ 50%]
test_nested_webhook.py::test_nested_payer_contact_email PASSED [100%]
============================== 2 passed in 0.04s ==============================
[sandbox:verify] Nested path navigation validated against both payload structures.`,
    },
  },
};
