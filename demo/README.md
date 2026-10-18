# DriftSmith Demo Services (DEMO ONLY)

> [!WARNING]
> Everything in `/demo` consists of **fake demo services** created exclusively for demonstrating DriftSmith's automated API remediation and cross-service pattern memory transfer. No real payments, real financial data, or external network connections are used.

## Architecture & Layout

```text
demo/
├── README.md                  # This guide
├── scripts/
│   └── verify_demo.py         # Subprocess test matrix runner (v1 pass, drifts fail)
├── mock-provider/             # FastAPI fake payment gateway (port 9000)
│   ├── mock_provider/
│   │   ├── main.py            # Endpoints: /payload, /admin/drift, /admin/state, /health
│   │   └── payloads.py        # v1, rename, type, nested payload variants
│   ├── tests/                 # Full pytest coverage for mock provider
│   ├── requirements.txt
│   └── README.md
├── target-app-a/              # Service: "payment-gateway" (canonical subscript style)
│   ├── service.toml           # DriftSmith target contract
│   ├── service.py             # parse_payment_event() & process_payment()
│   ├── payment_gateway/       # Models, webhook handler
│   ├── fixtures/payloads/     # v1.json, rename.json, type.json, nested.json
│   ├── tests/                 # Business rules & DRIFT_MODE tests
│   ├── requirements.txt
│   └── README.md
└── target-app-b/              # Service: "billing-worker" (different naming & layout)
    ├── service.toml           # DriftSmith target contract
    ├── worker.py              # ingest_billing_event() & process_payment()
    ├── billing_worker/        # Models, records
    ├── fixtures/payloads/     # Golden payloads
    ├── tests/                 # Business rules & DRIFT_MODE tests
    ├── requirements.txt
    └── README.md
```

---

## 1. Mock Payment Provider (Port 9000)

The mock provider simulates a Razorpay/Stripe-like payment provider whose payload schema can drift dynamically.

### How to Run

#### Windows (PowerShell) — Preferred
```powershell
cd demo\mock-provider
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn mock_provider.main:app --host 127.0.0.1 --port 9000
```

#### macOS / Linux
```bash
cd demo/mock-provider
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn mock_provider.main:app --host 127.0.0.1 --port 9000
```

### Endpoints
- `GET http://localhost:9000/payload`: Fetches the current payload for the active drift mode (default `v1`).
- `POST http://localhost:9000/admin/drift?mode=v1|rename|type|nested`: Mutates downstream payload emission mode.
- `GET http://localhost:9000/admin/state`: Inspects current mode: `{"mode": "..."}`.
- `GET http://localhost:9000/health`: Health probe returning `{"status": "ok"}`.

---

## 2. Running Verification Matrix

Run the cross-platform verification script from the repository root:

```powershell
python demo\scripts\verify_demo.py
```

### Expected Output

All unpatched services pass on baseline `v1` and fail as designed on all three drift scenarios:

| Target Application | Mode | Expected | Actual | Status |
|---|---|---|---|---|
| `payment-gateway` (`target-app-a`) | `v1` | **PASS** | PASS | MATCH |
| `payment-gateway` (`target-app-a`) | `rename` | **FAIL** | FAIL | MATCH |
| `payment-gateway` (`target-app-a`) | `type` | **FAIL** | FAIL | MATCH |
| `payment-gateway` (`target-app-a`) | `nested` | **FAIL** | FAIL | MATCH |
| `billing-worker` (`target-app-b`) | `v1` | **PASS** | PASS | MATCH |
| `billing-worker` (`target-app-b`) | `rename` | **FAIL** | FAIL | MATCH |
| `billing-worker` (`target-app-b`) | `type` | **FAIL** | FAIL | MATCH |
| `billing-worker` (`target-app-b`) | `nested` | **FAIL** | FAIL | MATCH |

---

## 3. How DriftSmith Backend Uses These Demo Services

DriftSmith's remediation engine discovers these demo targets dynamically using `DEMO_TARGETS_PATH` and monitors the mock provider via `PROVIDER_URL`.

### Backend Environment Configuration

```powershell
$env:LLM_MODE="mock"
$env:DEMO_TARGETS_PATH="../demo"
$env:PROVIDER_URL="http://localhost:9000"
```

### End-to-End Self-Healing Workflow

1. **Trigger Provider Drift:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:9000/admin/drift?mode=rename" -Method Post
   ```

2. **Heal Payment Gateway (Learns Fix via Scripted AI Agents):**
   ```powershell
   driftsmith heal --scenario rename --service payment-gateway
   # Result: Healed from memory: False, LLM calls: 2
   ```

3. **Heal Billing Worker (Transfers Fix from Memory with Zero AI Calls):**
   ```powershell
   driftsmith heal --scenario rename --service billing-worker
   # Result: Healed from memory: True, LLM calls: 0
   ```

4. **Repeat for Type and Nested Drifts:**
   - **Type Drift:**
     ```powershell
     Invoke-RestMethod -Uri "http://localhost:9000/admin/drift?mode=type" -Method Post
     driftsmith heal --scenario type --service payment-gateway   # 4 LLM calls, 2 iterations with critic retry
     driftsmith heal --scenario type --service billing-worker   # 0 LLM calls (Memory hit)
     ```
   - **Nested Drift:**
     ```powershell
     Invoke-RestMethod -Uri "http://localhost:9000/admin/drift?mode=nested" -Method Post
     driftsmith heal --scenario nested --service payment-gateway # 2 LLM calls
     driftsmith heal --scenario nested --service billing-worker # 0 LLM calls (Memory hit)
     ```
