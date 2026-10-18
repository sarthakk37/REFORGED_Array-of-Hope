# DriftSmith

DriftSmith is a self-healing agent for third-party API drift. When upstream payment and SaaS providers (such as Stripe or Razorpay) silently change their response payloads and schemas, DriftSmith detects the drift from failing payloads, diagnoses the schema mutation, synthesizes code patches, verifies them in isolated sandboxes against both legacy and modern payloads, and issues verified pull requests for human approval. DriftSmith also retains "learned patterns" to heal identical drift incidents instantly with zero LLM overhead.

## Repository Structure

```text
driftsmith/
├── frontend/             # React 18 + Vite + TypeScript frontend (standalone mock mode capable)
├── docs/                 # Architecture records and decision logs (DECISIONS.md)
├── README.md             # Project overview and high-level guide
├── LICENSE               # MIT License
└── .gitignore            # Root ignore rules
```

## Quick Start (Frontend)

To run the frontend in standalone **Mock Mode** (zero backend dependencies required):

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser. Demo credentials and scenarios are readily provided on the login screen.

For complete frontend documentation, architecture guides, and configuration options, see [`frontend/README.md`](frontend/README.md).
