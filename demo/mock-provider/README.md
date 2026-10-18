# DriftSmith Mock Payment Provider (DEMO / FAKE SERVICE ONLY)

> [!WARNING]
> This service is a **fake mock server** built exclusively to demonstrate DriftSmith's automated API remediation. It does not process real payments or communicate with any live financial networks.

## Overview

The Mock Payment Provider simulates a third-party payment gateway (such as Razorpay or Stripe) that silently introduces API breaking changes (drifts) without prior notification. DriftSmith monitors, diagnoses, and patches downstream consuming services against these drifts.

## Default Port

- **Port:** `9000`
- **Base URL:** `http://localhost:9000`

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health probe returning `{"status": "ok"}` |
| `GET` | `/payload` | Returns the active payment event payload for the current drift mode |
| `POST` | `/admin/drift?mode={v1\|rename\|type\|nested}` | Mutates upstream payload mode, returning `{"mode": "...", "previous": "..."}` |
| `GET` | `/admin/state` | Returns the current active mode: `{"mode": "..."}` |

## Drift Modes

1. **`v1` (Baseline):** Default valid payload with `amount_in_cents: 49900` and `customer.email: "asha@example.com"`.
2. **`rename`:** Key `amount_in_cents` is renamed to `total_amount` (integer `49900`).
3. **`type`:** Key `amount` emits currency as a decimal string in rupees (`"499.00"`), requiring 100x conversion back to integer paise.
4. **`nested`:** Email field relocated into `payer.contact.email`.

## How to Run

### Windows (PowerShell)
```powershell
# From demo/mock-provider
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn mock_provider.main:app --host 0.0.0.0 --port 9000
```

### macOS / Linux
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn mock_provider.main:app --host 0.0.0.0 --port 9000
```

## Running Tests

```powershell
python -m pytest tests -v
```
