# DriftSmith Backend

DriftSmith is an autonomous self-healing remediation engine for third-party API drift. When upstream API schema changes break consumers, DriftSmith diagnoses the failure, extracts AST usage sites, generates a backward-compatible patch, verifies old and new payload contracts in a safe test room sandbox, and prepares a pull request for human approval. If a drift pattern has been encountered previously, DriftSmith heals it instantly from memory with zero LLM inference calls.

---

## Architecture & Layer Map

DriftSmith enforces a strict one-way layer dependency architecture:

```
[api/]          FastAPI routers, request/response validation, SSE streaming
  ↓
[services/]     Pipeline orchestration, run management, approval lifecycle, event bus
  ↓
[core/]         Pure deterministic algorithms (sentinel, locator, patcher, fingerprint)
[ai/]           LLM client (Gemma via Gemini API), agent prompts, mock/replay engine
[integrations/] Ephemeral sandbox runner, GitHub, Slack, n8n webhook triggers
[db/]           SQLAlchemy 2.0 repositories, SQLite/PostgreSQL persistence
```

### Layer Constraints
1. **No business logic in `api/`**: Routers validate input, delegate to services, and format DTO responses.
2. **No HTTP or DB in `core/`**: All core algorithms are pure, deterministic, and offline-testable.
3. **No LLM code outside `ai/`**: Agent prompts and Google GenAI SDK calls are isolated in `ai/`.
4. **No raw SQL outside `db/`**: Repositories abstract all database interactions.
5. **Pydantic boundaries**: Strongly-typed schemas cross all architectural boundaries.

---

## How to Run

### Quickstart (Offline Mock Mode)

```bash
cd backend
python -m pip install -e ".[dev]"
python seeds/seed_demo_users.py
python -m uvicorn driftsmith.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at `http://localhost:8000`. OpenAPI documentation is available at `http://localhost:8000/docs`.

### Running Tests and Linters

```bash
# Run complete test suite (unit, integration, e2e)
pytest tests -v

# Run linters and code formatters
ruff check src tests seeds
black --check src tests seeds
```

---

## Environment Variables

All settings are managed via Pydantic Settings in `src/driftsmith/config.py`.

| Variable | Default | Description |
|---|---|---|
| `HOST` | `0.0.0.0` | API bind address |
| `PORT` | `8000` | API bind port |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed CORS origins for frontend client |
| `DATABASE_URL` | `sqlite:///./data/driftsmith.db` | SQLAlchemy connection string |
| `AUTH_ENABLED` | `true` | When `false`, authentication is bypassed and admin identity injected |
| `JWT_SECRET` | `demo-secret-key-change-in-production` | Secret for signing JWT access tokens |
| `JWT_EXPIRY_MINUTES` | `1440` | JWT token validity duration (24 hours) |
| `DEMO_PASSWORD` | `password` | Password for seeded demo accounts |
| `API_KEY` | `drift-secret-key-42` | Shared secret for `X-API-Key` webhook ingestion |
| `LLM_MODE` | `mock` | Mode: `mock` (scripted), `replay` (cache), or `live` (Gemini API) |
| `GEMINI_API_KEY` | *empty* | Required only when `LLM_MODE=live` |
| `GEMMA_MODEL_DIAG` | `gemma-2-9b-it` | Model identifier for triage agent |
| `GEMMA_MODEL_CODE` | `gemma-2-27b-it` | Model identifier for code generation |
| `DEMO_TARGETS_PATH` | `../demo` | Directory containing target services |
| `PROVIDER_URL` | `http://localhost:9000` | Upstream mock provider endpoint |
| `GITHUB_TOKEN` | *empty* | GitHub PAT for creating real pull requests (dry-run if unset) |
| `GITHUB_REPO` | *empty* | Target GitHub repository (e.g. `owner/repo`) |
| `SLACK_WEBHOOK_URL` | *empty* | Slack webhook endpoint (dry-run if unset) |
| `N8N_WEBHOOK_URL` | *empty* | Optional outbound webhook triggered when run completes |
| `SANDBOX_TIMEOUT_SECONDS` | `30` | Maximum execution time for sandbox tests |

---

## Seeded Demo Credentials

| Email | Role | Capabilities |
|---|---|---|
| `admin@demo.local` | `admin` | Full control: simulate runs, approve PRs, view patterns |
| `approver@demo.local` | `approver` | Approve proposed self-healing PRs |
| `viewer@demo.local` | `viewer` | Read-only inspection of runs and patterns |

Default password: `password` (configurable via `DEMO_PASSWORD`).
