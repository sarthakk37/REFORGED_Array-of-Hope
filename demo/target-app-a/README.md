# Target App A: Payment Gateway (DEMO SERVICE ONLY)

> [!WARNING]
> This service is a **fake demo service** built exclusively for DriftSmith demonstration. It is designed to be monitored, patched, and verified by DriftSmith's autonomous remediation engine.

## Overview

`payment-gateway` ingests webhook payment events from the mock provider. It validates business rules and converts incoming payloads into internal `PaymentRecord` models:
- **Rule 1 (Amount):** Amount must be stored as integer paise in `amount_paise` (49900 for v1 baseline); never float.
- **Rule 2 (Customer Email):** Customer email must be normalized to lowercase in `customer_email`.
- **Rule 3 (Status):** Payment must have status `"captured"` to be marked paid.

## Service Configuration

Configured via `service.toml`:
- **Service Name:** `payment-gateway`
- **Language:** `python`
- **Source Files:** `["service.py"]` (strictly bounded file allowed for patch modifications)
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
