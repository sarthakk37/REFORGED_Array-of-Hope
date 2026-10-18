# DriftSmith Backend API Contract

This document specifies the exact REST and Server-Sent Events (SSE) API contract expected by the DriftSmith frontend. The backend implementation should conform strictly to these paths, request/response schemas, and event envelopes.

---

## 1. Authentication & Security

### User Sessions
- Most API routes require a bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <access_token>
  ```
- Unauthenticated or expired requests must return `HTTP 401 Unauthorized` with `{ "detail": "..." }`. The frontend automatically purges session tokens and routes the user to the login screen upon receiving a 401.

### Webhook Authentication (n8n / External)
- Webhook endpoints accept requests signed with the shared webhook secret header:
  ```http
  X-DriftSmith-Key: <webhook_api_key>
  ```
- Invalid keys must return `HTTP 403 Forbidden` with `{ "detail": "Invalid or missing webhook signature" }`.

---

## 2. REST Endpoints

### 2.1 Authentication

#### `POST /auth/login`
Authenticates a user and issues a JWT bearer token.

- **Request Body:**
  ```json
  {
    "email": "approver@example.com",
    "password": "password"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-1",
      "email": "approver@example.com",
      "role": "approver"
    }
  }
  ```
- **Role enum:** `"viewer"` | `"approver"` | `"admin"`

#### `GET /auth/me`
Fetches the currently authenticated user's profile.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "id": "usr-1",
    "email": "approver@example.com",
    "role": "approver"
  }
  ```

---

### 2.2 Remediation Runs

#### `GET /runs`
Retrieves a list of remediation runs sorted descending by start time.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "run-100",
      "scenario": "rename",
      "service_name": "Stripe Webhook Listener",
      "source": "n8n",
      "external_ref": "workflow-drift-heal-42",
      "status": "awaiting_approval",
      "confidence": 0.99,
      "verified": true,
      "healed_from_memory": false,
      "llm_calls": 3,
      "iterations": 1,
      "started_at": "2026-10-18T14:40:00.000Z",
      "finished_at": "2026-10-18T14:40:22.000Z"
    }
  ]
  ```
- **Fields:**
  - `scenario`: `"rename"` | `"type"` | `"nested"`
  - `source`: `"manual"` | `"webhook"` | `"ci"` | `"n8n"`
  - `status`: `"queued"` | `"running"` | `"verified"` | `"failed"` | `"awaiting_approval"` | `"approved"` | `"rejected"`
  - `confidence`: `number | null` (0.0 to 1.0)
  - `external_ref`: `string | null` (e.g. n8n execution id or external tracking ID)

#### `GET /runs/:id`
Retrieves full details, drift diagnosis report, patch diff, and pull request information for a specific run.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "id": "run-100",
    "scenario": "rename",
    "service_name": "Stripe Webhook Listener",
    "source": "n8n",
    "external_ref": "workflow-drift-heal-42",
    "status": "awaiting_approval",
    "confidence": 0.99,
    "verified": true,
    "healed_from_memory": false,
    "llm_calls": 3,
    "iterations": 1,
    "started_at": "2026-10-18T14:40:00.000Z",
    "finished_at": "2026-10-18T14:40:22.000Z",
    "drift_report": {
      "fingerprint": "fp_rename_amount_in_cents_0x9b",
      "summary": "Provider renamed amount_in_cents to total_amount.",
      "risk": "medium",
      "changes": [
        {
          "type": "renamed",
          "path": "amount_in_cents",
          "from": "amount_in_cents",
          "to": "total_amount",
          "confidence": 0.98
        }
      ]
    },
    "patch": {
      "diff_text": "--- a/services/payment.py\n+++ b/services/payment.py\n...",
      "plan_summary": "Normalize total_amount to amount_in_cents with fallback",
      "verified": true,
      "test_results": [
        {
          "name": "Old Payload Compatibility",
          "payload_version": "old",
          "passed": true,
          "duration_ms": 38,
          "output": "Parsed amount_in_cents successfully"
        },
        {
          "name": "New Payload Compatibility",
          "payload_version": "new",
          "passed": true,
          "duration_ms": 41,
          "output": "Parsed total_amount fallback successfully"
        }
      ],
      "sandbox_log": "[safe test room] Executed pytest in isolated container: 2 passed in 0.08s"
    },
    "pull_request": {
      "url": "https://github.com/company/payments/pull/42",
      "branch": "driftsmith/fix-run-100",
      "status": "dry_run",
      "dry_run": true
    }
  }
  ```

#### `POST /runs/simulate`
Manually starts a self-healing remediation run (used from the Home Page Live Demo Stage).

- **Request Body:**
  ```json
  {
    "scenario": "type",
    "service_name": "Payment app",
    "source": "manual",
    "external_ref": null
  }
  ```
- **Response `200 OK` (or `202 Accepted`):**
  ```json
  {
    "run_id": "run-804"
  }
  ```

#### `POST /runs/:id/approve`
Approves a proposed self-healing patch, opening or finalizing the GitHub Pull Request.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  {
    "status": "approved",
    "pull_request": {
      "url": "https://github.com/company/payments/pull/42",
      "branch": "driftsmith/fix-run-100",
      "status": "open",
      "dry_run": false
    }
  }
  ```

---

### 2.3 Webhook Ingestion (n8n & External Triggers)

#### `POST /api/v1/webhooks/drift`
Receives upstream drift notifications triggered by n8n orchestrations, webhook gateways, or monitoring listeners.

- **Headers:**
  - `Content-Type: application/json`
  - `X-DriftSmith-Key: <shared_webhook_key>`
- **Request Body:**
  ```json
  {
    "service_name": "Stripe Webhook Listener",
    "scenario": "rename",
    "source": "n8n",
    "external_ref": "n8n-exec-9412",
    "payload": {
      "id": "evt_101",
      "total_amount": "499.00"
    }
  }
  ```
- **Response `202 Accepted`:**
  ```json
  {
    "run_id": "run-805"
  }
  ```

---

### 2.4 Patterns & System Telemetry

#### `GET /patterns`
Returns remembered fixes (learned patterns) that enable instant zero-inference healing.

- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
  ```json
  [
    {
      "id": "pat-1",
      "fingerprint": "fp_rename_amount_in_cents_0x9b",
      "summary": "amount_in_cents renamed to total_amount",
      "times_used": 3,
      "created_at": "2026-10-18T10:00:00.000Z"
    }
  ]
  ```

#### `GET /system/health`
Returns truthful subsystem health telemetry.

- **Headers:** `Authorization: Bearer <token>` (optional if health is public)
- **Response `200 OK`:**
  ```json
  {
    "status": "ok",
    "llm_mode": "mock",
    "auth_enabled": true,
    "integrations": [
      {
        "name": "database",
        "status": "live",
        "detail": "SQLite (demo)"
      },
      {
        "name": "llm",
        "status": "live",
        "detail": "Gemma via Gemini API (mock mode)"
      },
      {
        "name": "github",
        "status": "dry_run",
        "detail": "Dry-run PR preview"
      },
      {
        "name": "slack",
        "status": "disabled",
        "detail": "Not connected"
      },
      {
        "name": "sandbox",
        "status": "live",
        "detail": "Safe test room container (simulated)"
      },
      {
        "name": "n8n",
        "status": "live",
        "detail": "Webhook endpoint listening"
      }
    ]
  }
  ```

---

## 3. Real-Time Event Stream (Server-Sent Events)

### `GET /api/runs/:id/stream`
Pushes live event logs to the Remediation Stage as agents diagnose, code, test, and verify fixes.

- **Headers:**
  - `Accept: text/event-stream`
  - `Authorization: Bearer <token>`
- **SSE Stream Protocol:**
  - Standard `data: <json>\n\n` frames.
  - Periodic `: keep-alive\n\n` comments to prevent proxy timeouts.
  - Terminal event sends `{ "status": "completed" }` or closes the connection.

### Event Payload Schema
```json
{
  "id": "evt-1",
  "run_id": "run-100",
  "seq": 1,
  "agent": "sentinel",
  "kind": "action",
  "message": "Detector detected API change in Stripe Webhook Listener payload.",
  "payload": {
    "storyStep": 1,
    "isRetry": false,
    "confidence": 0.98
  },
  "created_at": "2026-10-18T14:40:01.000Z"
}
```

- **`agent` Roles:**
  - `"sentinel"` (Detector)
  - `"triage"` (Investigator)
  - `"locator"` (Locator)
  - `"coder"` (Code writer)
  - `"critic"` (Reviewer)
  - `"verifier"` (Tester)
  - `"memory"` (Memory)
  - `"pr"` (Reporter)
  - `"system"` (System)
- **`kind`:** `"info"` | `"thought"` | `"action"` | `"success"` | `"warning"` | `"error"`
- **`storyStep`:**
  1. `1`: API changed
  2. `2`: Problem found
  3. `3`: Fix written
  4. `4`: Fix tested
  5. `5`: Ready for your approval
