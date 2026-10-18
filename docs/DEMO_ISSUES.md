# DriftSmith Demo Target & Backend Integration Issues

This document records architectural edge cases and backend constraints discovered during demo service development and integration testing.

---

### ISSUE-001: Patcher Nested Subscript Ternary Evaluates Parent Key Presence

- **Component:** `backend/src/driftsmith/core/patcher.py` (`_DualCompatTransformer.leave_Subscript`)
- **Observed Behavior:**
  When transforming nested dictionary subscripts such as `payload["customer"]["email"]` under `RemapPathAction(target_path="customer.email", source_path="payer.contact.email")`, the patcher generates:
  ```python
  (payload.get("customer", {}).get("email") if "customer" in payload else payload.get("payer", {}).get("contact", {}).get("email"))
  ```
  If upstream relocates only the `email` key while leaving remaining attributes under `customer` (e.g., `{"customer": {"name": "Asha Verma"}, "payer": {"contact": {"email": "asha@example.com"}}}`), the expression `"customer" in payload` evaluates to `True`. The expression evaluates the `if` branch `payload.get("customer", {}).get("email")`, which yields `None`, never executing the fallback `else` branch.
- **Exact Error if Triggered:**
  ```text
  AssertionError: assert None == 'asha@example.com'
  ```
- **Demo Mitigation:** In demo payloads and mock provider, the nested drift moves the contact object to `payer` without leaving a conflicting empty or partial `"customer"` dictionary, ensuring the patch evaluates to `payload.get("payer", {}).get("contact", {}).get("email")`.
- **Recommended Backend Fix:** In `patcher.py`, check leaf key presence rather than parent presence:
  ```python
  f'(payload.get("{inner_key}", {{}}).get("{outer_key}") if payload.get("{inner_key}", {{}}).get("{outer_key}") is not None else {src_expr})'
  ```

---

### ISSUE-002: Sentinel Drift Detector and Coder Mock Hardcode New Key Name `amount` for Type Drift

- **Component:** `backend/src/driftsmith/core/sentinel.py` (Line 62) and `backend/fixtures/llm_mock/coder_type_iteration*.json`
- **Observed Behavior:**
  In `sentinel.py`:
  ```python
  for old_path, old_val in old_flat.items():
      if old_path not in new_flat:
          for new_path, new_val in new_flat.items():
              if ("amount" in old_path or "amount" in new_path) and new_path not in old_flat:
  ```
  If upstream preserves the key name `amount_in_cents` while changing its type to `"499.00"` rupees, `old_path not in new_flat` evaluates to `False` (because `amount_in_cents` is still present in `new_flat`). Sentinel fails to recognize type conversion, falling through to generic diff or reporting no drift.
  Furthermore, `coder_type_iteration1.json` and `coder_type_iteration2.json` hardcode `source_path: "amount"`. If the payload keeps `amount_in_cents`, the AST transformation generates `payload["amount"]`, raising `KeyError: 'amount'`.
- **Exact Error if Key Preserved:**
  ```text
  KeyError: 'amount'
  ```
- **Demo Mitigation:** The mock provider and target fixtures use `amount: "499.00"`, matching `tests/sample_target/fixtures/payloads/type.json` and the scripted mock LLM fixtures.

---

### ISSUE-003: Sandbox Runner Generates Invalid Import If Target Source File Contains Path Delimiters

- **Component:** `backend/src/driftsmith/integrations/sandbox_runner.py` (`_create_contract_test_file`)
- **Observed Behavior:**
  Lines 23-28 construct the sandbox contract test via string substitution:
  ```python
  module_name = target_file.replace(".py", "")
  code = f'from {module_name} import process_payment'
  ```
  If `source_files` in `service.toml` specifies a nested path (such as `payment_gateway/service.py` or `billing_worker/worker.py`), `module_name` becomes `payment_gateway/service` or `billing_worker/worker`. This results in `from payment_gateway/service import process_payment`, which raises a Python `SyntaxError`.
- **Exact Error if Nested Path Used:**
  ```text
  SyntaxError: invalid syntax (test_contract_replay.py: from payment_gateway/service import process_payment)
  ```
- **Demo Mitigation:** Target services expose their primary editable entrypoint at the root level (`service.py` for target-app-a, `worker.py` for target-app-b).
- **Recommended Backend Fix:** In `sandbox_runner.py`, convert filesystem path separators into Python dot notation:
  ```python
  module_name = target_file.replace("\\", "/").replace(".py", "").replace("/", ".")
  ```
