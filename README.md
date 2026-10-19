# DriftSmith

DriftSmith is a self-healing agent for third-party API drift. When upstream payment and SaaS providers (such as Stripe or Razorpay) silently change their response payloads and schemas, DriftSmith detects the drift from failing payloads, diagnoses the schema mutation, synthesizes code patches, verifies them in isolated sandboxes against both legacy and modern payloads, and issues verified pull requests for human approval. DriftSmith also retains "learned patterns" to heal identical drift incidents instantly with zero LLM overhead.

## Repository Structure

```text
driftsmith/
├── backend/              # FastAPI backend engine, SQLite/Postgres storage & LLM orchestrator
│   ├── src/              # Core agent logic, sandbox runner, and API routes
│   ├── migrations/       # Alembic database migrations
│   └── tests/            # pytest suite (unit, integration & sandbox verification)
├── demo/                 # Target application simulation sandbox
│   ├── mock-provider/    # Upstream API simulator (v1 vs v2 breaking schema payloads)
│   ├── target-app-a/     # Target payment gateway consumer service
│   ├── target-app-b/     # Target billing worker consumer service
│   └── scripts/          # E2E demo run and verification scripts
├── docs/                 # Architecture decision records (DECISIONS.md) & API contracts
├── frontend/             # React 18 + Vite + TypeScript frontend (dual mock/HTTP client)
│   ├── src/              # UI components, state management, and real-time event streaming
│   └── tests/            # Vitest unit and component tests
├── LICENSE               # MIT License
└── README.md             # Project overview and high-level guide
```

## Quick Start

### 1. Frontend (Standalone Mock Mode)

The frontend can run standalone in zero-backend **Mock Mode** with rich, simulated drift scenarios and interactive repair stages:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser. Demo credentials and scenarios are readily provided on the login screen.

### 2. Backend Engine

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
python seeds/seed_demo_users.py
pytest tests -v
uvicorn src.main:app --reload --port 8000
```

### 3. Demo Target Applications & Upstream Drift Simulation

To test DriftSmith against real simulated breaking upstream API changes:

```bash
cd demo
# Refer to demo/README.md for end-to-end drift injection and verification commands
```

## Architecture & Design Decisions

For detailed engineering trade-offs, security considerations, and UI/UX design choices, see:
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — Architecture & Design Decisions
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — API & Webhook Specifications
- [`frontend/README.md`](frontend/README.md) — Frontend Architecture & Component Guide
- [`backend/README.md`](backend/README.md) — Backend Architecture & Service Guide
- [`demo/README.md`](demo/README.md) — End-to-End Target App Simulation Guide
