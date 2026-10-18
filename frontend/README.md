# DriftSmith Frontend Cockpit

DriftSmith is an autonomous self-healing agent for third-party API drift. This repository contains the standalone React 18 + TypeScript cockpit designed to inspect failing payloads, track real-time multi-agent reasoning, evaluate unified diffs in isolated sandboxes, and authorize pull requests.

The application operates in two distinct modes:
1. **Mock Mode (`VITE_USE_MOCK=true`)**: Complete in-memory simulation with simulated network latency, pre-seeded historical runs, and live streaming multi-agent execution with zero backend dependencies.
2. **Real Mode (`VITE_USE_MOCK=false`)**: Full HTTP and Server-Sent Events client communicating with the DriftSmith Python/FastAPI backend using JWT Bearer authentication.

---

## Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 20 LTS and Node 24)
- npm 9+

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Run in Mock Mode (Default)
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

#### Demo Credentials:
- **Approver Role:** `approver@demo.local` / `demo1234` (Can approve patches & open PRs)
- **Admin Role:** `admin@demo.local` / `demo1234` (Full access)
- **Viewer Role:** `viewer@demo.local` / `demo1234` (Read-only view; approval disabled)

*(Quick buttons on the login screen automatically pre-fill these credentials)*

---

## Key Demo Flows

### 1. Full Multi-Agent Synthesis (Type Shift Drift)
1. Sign in as `approver@demo.local`.
2. On the Cockpit dashboard, locate the **Drift Injection Simulator**.
3. Select **Type Shift Mutation** (Integer paise changed to string decimal rupees `"499.00"`).
4. Leave service as `payment-gateway` and click **Break The API**.
5. Watch the live **Agent Execution Trace** (~20-22s):
   - Sentinel detects schema drift
   - Triage diagnoses type divergence
   - Locator identifies `services/payment_webhook.py:28`
   - Coder drafts initial candidate
   - **Verifier fails attempt 1** (precision truncation error)
   - **Critic analyzes trace** and advises sanitization & rounding
   - Coder retries with refined logic
   - Verifier passes both old & new payload test suites
   - PR Automator prepares branch `fix/drift-amount-type-coercion`
6. Switch between **Synthesized Patch (Diff)**, **Drift Report**, and **Sandbox Verification** tabs.
7. Click **Approve & Open PR** in the bottom approval bar. Confirm the modal and view the opened PR status.

### 2. Instant Memory Healing (Zero LLM Calls)
1. In the simulator, change the service name to `target-app-b` (or click the quick chip).
2. Click **Heal From Memory**.
3. DriftSmith detects the matching AST fingerprint in pattern memory.
4. The timeline resolves in ~5 seconds using only Memory, Verifier, and PR agents with **0 LLM calls**.

---

## Environment Variables

Defined in `.env.example` and read exclusively through `src/config/env.ts`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | `string` | `http://localhost:8000` | Target URL for real backend API and SSE events |
| `VITE_USE_MOCK` | `boolean` | `true` | When true, uses in-memory mock client and timer stream |

---

## Folder Map

```text
frontend/
├── README.md                      # Architecture, runbook, and guide
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and scripts
├── vite.config.ts                 # Bundler and Vitest configuration
├── tsconfig.json                  # Strict TypeScript configuration
├── tailwind.config.ts             # Dark "Forge" theme design tokens
├── nginx.conf                     # Production SPA routing configuration
├── Dockerfile                     # Multi-stage production container build
└── src/
    ├── main.tsx, App.tsx, routes.tsx
    ├── config/
    │   └── env.ts                 # Central place where import.meta.env is read
    ├── api/
    │   ├── apiClient.ts           # ApiClient interface contract
    │   ├── httpClient.ts          # Real HTTP fetch implementation with auth
    │   ├── mockClient.ts          # In-memory mock implementation
    │   ├── eventStream.ts         # Real-time EventStream interface
    │   ├── sseStream.ts           # Real SSE streaming implementation
    │   ├── mockStream.ts          # Timer-based simulation of agent run
    │   ├── types.ts               # Shared TypeScript schemas matching backend
    │   └── index.ts               # Switches mock vs real based on VITE_USE_MOCK
    ├── mock/                      # Fixtures: users, runs, events, drifts, patterns, health
    ├── auth/                      # AuthContext, ProtectedRoute, RoleGate, tokenStorage
    ├── hooks/                     # useRuns, useRun, useRunEvents, usePatterns, useHealth, useTriggerDrift, useApprove
    ├── pages/                     # LoginPage, DashboardPage, RunDetailPage, LearnedPatternsPage, SystemStatusPage, NotFoundPage
    ├── components/
    │   ├── layout/                # AppShell, Sidebar, TopBar (with Anvil logo)
    │   ├── runs/                  # RunList, AgentTimeline, DriftReportCard, DiffViewer, TestResultsPanel, ApprovalBar
    │   ├── demo/                  # TriggerDriftPanel
    │   ├── system/                # IntegrationStatusCard
    │   └── ui/                    # Button, Card, Badge, Spinner, EmptyState, ErrorState, Toast, Modal, Tabs
    ├── lib/                       # formatDate, formatDuration, classNames, diff (handcrafted line diff helper)
    ├── styles/                    # index.css (Forge theme variables and keyframes)
    └── test/                      # Vitest test suite and setup
```

---

## Architecture: How Data Flows

```text
[Page Component] ──> [Custom Hook] ──> [api export] ──> [ApiClient Interface]
                                                              │
                              ┌───────────────────────────────┴───────────────────────────────┐
                              ▼                                                               ▼
                     [mockClient.ts]                                                   [httpClient.ts]
                    (in-memory state,                                                 (fetch + Bearer,
                   simulated latencies)                                                401 handling)
```

1. **Pages compose UI components** and fetch data using custom hooks (`useRuns`, `useRun`, `useRunEvents`).
2. **Hooks delegate to `api`** (`src/api/index.ts`). No component or hook ever invokes `fetch` directly.
3. **`api` conforms to `ApiClient`** interface. At startup, `src/config/env.ts` determines whether `mockClient` or `httpClient` is mounted.
4. **Real-time updates flow through `stream`** (`EventStream`). In mock mode, `mockStream` coordinates timed agent actions. In real mode, `sseStream` reads chunked Server-Sent Events with Bearer tokens.

---

## How to Change Things

### Adding a New Page
1. Create your component in `src/pages/MyNewPage.tsx`.
2. Open `src/routes.tsx` and add a new route entry inside the `AppShell` children array:
   ```tsx
   {
     path: 'my-new-path',
     element: <MyNewPage />,
   }
   ```
3. Add a navigation entry to `src/components/layout/Sidebar.tsx` if you want it in the main sidebar.

### Adding an API Method
1. Declare the type signature in `src/api/types.ts`.
2. Add the method definition to `ApiClient` in `src/api/apiClient.ts`.
3. Implement the method in `src/api/httpClient.ts` using `this.request(...)`.
4. Implement the in-memory simulated response in `src/api/mockClient.ts`.
5. Wrap the method call in a React Query hook inside `src/hooks/useMyNewHook.ts`.

### Changing Theme Tokens & Colors
1. Colors and forge tokens are centralized in `tailwind.config.ts` under `theme.extend.colors.forge`.
2. Global CSS variables and keyframes (such as `shimmer` and scrollbars) are defined in `src/styles/index.css`.

---

## Quality Verification Commands

```bash
# Run unit and integration test suite
npm run test

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```
