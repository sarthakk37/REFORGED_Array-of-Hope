# DriftSmith Demo Target Contract

This specification defines the contract between the DriftSmith remediation engine and demo target services. DriftSmith never hardcodes demo service code or assumptions; all targets are loaded dynamically via the Target Registry.

---

## 1. Directory Structure

Targets reside under the directory specified by `DEMO_TARGETS_PATH` (default: `../demo`).
Each target service is an independent subdirectory structured as follows:

```
<DEMO_TARGETS_PATH>/<service-dir>/
├── service.toml
├── fixtures/
│   └── payloads/
│       ├── v1.json           # Baseline (old) payload
│       ├── rename.json       # Scenario: renamed keys
│       ├── type.json         # Scenario: changed data types / units
│       └── nested.json       # Scenario: restructured / nested keys
├── <source_files>            # Service implementation (editable by patcher)
└── <test_files>              # Target test suite (invoked by sandbox)
```

---

## 2. Configuration: `service.toml`

Every target service must include a root `service.toml` parsed with standard TOML:

```toml
name = "payment-gateway"
language = "python"
source_files = ["service.py"]
test_command = "pytest tests"
provider_payload_file = "fixtures/payloads/v1.json"
```

### Schema

| Field | Type | Description |
|---|---|---|
| `name` | string | Unique service identifier matching frontend selection (e.g. `"payment-gateway"`, `"Stripe Webhook Listener"`) |
| `language` | string | Target programming language (`"python"`) |
| `source_files` | list[string] | Editable file paths relative to target root. DriftSmith's patcher is strictly prohibited from modifying files outside this list. |
| `test_command` | string | Shell command executed inside the sandbox to verify tests (e.g. `pytest tests`) |
| `provider_payload_file` | string (optional) | Relative path to local active payload file when offline |

---

## 3. Fixture Payloads

Target fixtures supply golden sample payloads for baseline execution and synthetic drift simulations:

- **`fixtures/payloads/v1.json`**: Baseline valid payload expected by current unpatched code.
- **`fixtures/payloads/rename.json`**: Drift where key names changed (e.g. `amount_in_cents` -> `total_amount`).
- **`fixtures/payloads/type.json`**: Drift where types / units changed (e.g. integer paise `49900` -> decimal string `"499.00"`).
- **`fixtures/payloads/nested.json`**: Drift where fields were relocated into nested objects (e.g. `customer.email` -> `payer.contact.email`).

---

## 4. Mock Provider Protocol & Offline Fallback

In a live container environment, an upstream mock provider may serve dynamic payloads:

1. **Triggering Drift:**
   ```http
   POST {PROVIDER_URL}/admin/drift?mode=<v1|rename|type|nested>
   ```
   Instructs the mock provider server to mutate its downstream emission mode.

2. **Fetching Active Payload:**
   ```http
   GET {PROVIDER_URL}/payload
   ```
   Retrieves the current payload JSON emitted by the provider.

3. **Offline Fallback Guarantee:**
   If `PROVIDER_URL` is unset, unreachable, or times out, DriftSmith transparently falls back to reading the scenario fixture directly from `<target>/fixtures/payloads/<scenario>.json`. The entire heal pipeline functions completely offline with zero network connectivity.

---

## 5. Security & Isolation Constraints

- **Path Traversal Protection:** Target source file paths must resolve strictly within the target's root directory. Any attempt to modify paths containing `..` or leading slashes will fail validation.
- **Sandboxed Execution:** Target test suites are executed in ephemeral, isolated sandboxes (Docker container with no networking or subprocess virtualenv with timeout).
