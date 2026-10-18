# Target App B: Billing Worker (DEMO SERVICE ONLY)

> [!WARNING]
> This service is a **fake demo service** built exclusively for DriftSmith demonstration. It proves that a fix learned for `payment-gateway` successfully transfers to a differently structured service (`billing-worker`) via memory with 0 LLM calls.

## Overview

`billing-worker` processes incoming payment notifications into billing invoices. It uses:
- Different file name: `worker.py`
- Different function name: `ingest_billing_event`
- Different variable names: `tx_id`, `paise_val`, `email_addr`, `raw_status`
- Mixed `.get(...)` and subscript access
- Identical business rules:
  - **Rule 1 (Amount):** Amount must be stored as integer paise in `amount_paise` (49900 for v1); never float.
  - **Rule 2 (Customer Email):** Customer email must be normalized to lowercase in `customer_email`.
  - **Rule 3 (Status):** Payment must have status `"captured"` to be marked paid.

## Service Configuration

Configured via `service.toml`:
- **Service Name:** `billing-worker`
- **Language:** `python`
- **Source Files:** `["worker.py"]` (strictly bounded file allowed for patch modifications)
- **Test Command:** `pytest tests`
- **Provider Payload File:** `fixtures/payloads/v1.json`

## Running Tests

```powershell
# Baseline tests pass
python -m pytest tests -v

# Drifting payloads fail on unpatched code
$env:DRIFT_MODE="rename"; python -m pytest tests -v; Remove-Item Env:\DRIFT_MODE
$env:DRIFT_MODE="type"; python -m pytest tests -v; Remove-Item Env:\DRIFT_MODE
$env:DRIFT_MODE="nested"; python -m pytest tests -v; Remove-Item Env:\DRIFT_MODE
```
