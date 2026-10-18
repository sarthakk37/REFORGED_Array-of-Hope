// Scenario fixture for "Email moved" (Object restructure).
// Simulates provider moving customer email from customer.email to payer.contact.email.

import { DriftScenarioData } from './types';

export const nestedScenario: DriftScenarioData = {
  scenario: 'nested',
  title: 'Email moved',
  technicalName: 'Object restructure',
  description: 'Customer email moved from `customer.email` to `payer.contact.email`.',
  plainCaption:
    'The provider moved customer.email to payer.contact.email. Your app cannot find the customer email at the top level, so it breaks.',
  diffPlainCaption:
    'Works with both old and new data: looks inside payer.contact.email first, and falls back to customer.email if needed.',
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
    plan_summary:
      'Read payer.contact.email with automatic fallback to customer.email.',
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
};
