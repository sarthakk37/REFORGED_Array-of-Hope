# DriftSmith Frontend Cockpit

DriftSmith is an autonomous self-healing agent for third-party API changes. When an upstream payment or SaaS provider alters their schema without warning, DriftSmith intercepts the error, diagnoses the exact field drift, generates a dual-compatible patch, verifies it in a safe test room against both old and new payloads, and prepares a human-approved pull request.

The user interface tells a simple 5-step story designed for anyone to understand in 10 seconds:
1. **API changed**
2. **Problem found**
3. **Fix written**
4. **Fix tested**
5. **Ready for your approval**

---

## Quick Start

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

#### Demo Credentials
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Approver** | `approver@demo.local` | `demo1234` | Full demo & one-click PR approvals |
| **Admin** | `admin@demo.local` | `demo1234` | Full administration & approvals |
| **Viewer** | `viewer@demo.local` | `demo1234` | Read-only inspection (approval disabled) |

---

## Running Against the Real Backend

To run DriftSmith against the Python/FastAPI backend:
1. Create or edit `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_USE_MOCK=false
   VITE_NARRATION=speech
   ```
2. Start the dev server: `npm run dev`.
3. In real mode:
   - `src/api/httpClient.ts` handles all HTTP REST endpoints with Bearer tokens and 401 automatic redirection.
   - `src/api/sseStream.ts` connects to Server-Sent Events via `fetch` streaming with auth tokens.
   - Human approvals execute `POST /api/runs/{id}/approve` on the real server.

---

## Environment Variables

All environment variables are strictly documented in `.env.example`:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | `http://localhost:8000` | Base URL of the backend API |
| `VITE_USE_MOCK` | Boolean | `true` | When `true`, runs completely in-memory with zero network calls |
| `VITE_NARRATION` | String | `speech` | Guided demo narration: `speech` (browser TTS), `audio` (mp3 files), or `off` |

> Note: `import.meta.env` is accessed exclusively in `src/config/env.ts`. No other file directly references environment variables.

---

## Folder Map

```
frontend/src/
├── api/                    # API client interface, mock client, http client, and SSE streams
│   ├── apiClient.ts        # ApiClient interface contract
│   ├── httpClient.ts       # Real HTTP client with Bearer auth and 401 handling
│   ├── mockClient.ts       # In-memory mock client backed by mockStore
│   ├── eventStream.ts      # EventStream interface contract
│   ├── sseStream.ts        # Real Server-Sent Events implementation
│   ├── mockStream.ts       # Timer-based simulation of real-time remediation runs
│   └── types.ts            # Core domain types (Run, RunDetail, DriftReport, Patch, etc.)
├── auth/                   # Authentication context, token storage, and route guards
│   ├── AuthContext.tsx     # Role-aware authentication context and hook
│   ├── ProtectedRoute.tsx  # Protected route wrapper
│   └── tokenStorage.ts     # LocalStorage / sessionStorage persistence
├── components/             # Reusable UI component modules
│   ├── demo/               # ChoiceCard, SimulatorHeader, SimulatorControls, PresenterOverlay
│   ├── layout/             # AppShell, Sidebar, TopBar
│   ├── runs/               # RemediationStage, StoryProgress, BeforeAfterPayload, PlainLog, FixDiff, SafeTestResults, ApprovalPanel
│   ├── system/             # IntegrationStatusCard
│   └── ui/                 # Accessible primitives (Button, Card, Badge, Modal, Toast, Spinner, TermHint)
├── config/                 # Central environment configuration (env.ts)
├── hooks/                  # React Query data-fetching and mutation hooks
│   ├── useRuns.ts          # Active polling hook for remediation runs
│   ├── useRun.ts           # Individual run detail hook
│   ├── useRunEvents.ts     # Real-time SSE / mock event subscription hook
│   ├── useTriggerDrift.ts  # Simulation trigger mutation hook
│   ├── useApprove.ts       # Fix approval mutation hook
│   ├── usePatterns.ts      # Remembered fixes hook
│   └── useHealth.ts        # Backend integration health hook
├── lib/                    # General utilities (classNames, diff calculation, date formatting)
├── mock/                   # Single source of truth for mock mode
│   ├── mockStore.ts        # Central mutable state store and unified metric derivation
│   ├── drifts.ts           # Registry of the 3 API breakage scenarios
│   ├── scenarios/          # Individual scenario fixtures (type, rename, nested)
│   ├── events.ts           # Agent telemetry event sequences (Detector, Investigator, etc.)
│   ├── events/             # Scenario-specific event sequence modules
│   ├── runs.ts             # Initial runs list
│   ├── patterns.ts         # Initial remembered fixes
│   ├── health.ts           # Health status fixtures
│   └── users.ts            # Demo user credentials and roles
├── pages/                  # Route page components
│   ├── DashboardPage.tsx   # Live demo stage and interactive simulator
│   ├── HistoryPage.tsx     # Complete remediation run history
│   ├── RunDetailPage.tsx   # Detailed telemetry and PR preview for any run
│   ├── RememberedFixesPage.tsx # Catalog of remembered fixes with AI call savings
│   ├── SystemStatusPage.tsx    # Live system and integration health status
│   ├── LoginPage.tsx       # Authentication login page
│   └── NotFoundPage.tsx    # 404 fallback page
├── styles/                 # Global styles and Tailwind configuration
├── test/                   # Vitest unit and smoke test suites
└── voice/                  # Voice narration engine
    ├── narrator.ts         # VoiceNarrator interface contract
    ├── speechSynthesisNarrator.ts # Browser Web Speech API synthesizer
    ├── audioFileNarrator.ts# Recorded MP3 audio player with fallback
    ├── silentNarrator.ts   # Cadence-based word-count silent timer
    └── index.ts            # Factory selecting narrator from VITE_NARRATION
```

---

## Voice Narration & Guided Demo Walkthrough

The guided demo presents Priya's payment app story with live spoken voice narration synchronized with visual cues:

1. **How It Works**:
   - Spoken audio and visual animations advance in strict synchronization.
   - The stage does not advance to the next step until the current step's voice narration finishes speaking (or the silent duration elapses).
   - If playback speed is toggled to 2x, speech rate increases to 1.5x.
   - Pausing stops both speech and visual timers; Next/Prev cancels current speech and plays the new step immediately.
   - During each step, relevant UI cards (simulator card, before/after payload, diff viewer, safe test results, PR preview) are smoothly highlighted.

2. **Narration Modes (`VITE_NARRATION`)**:
   - `speech` (Default): Uses the browser's Web Speech API (`SpeechSynthesis`). Auto-selects an Indian-accented English voice (`en-IN`) or natural-sounding system voice, with persistent voice selection, volume slider, and mute toggles on the overlay.
   - `audio`: Plays pre-recorded MP3 voice tracks from `/public/narration/<stepId>.mp3`. If an MP3 is missing, it falls back seamlessly to word-cadence timing without errors.
   - `off`: Disables audio completely and advances steps based on word-count reading cadence (~160 wpm).

3. **Using Custom Audio Tracks**:
   To drop in custom voiceovers, place MP3 files into `frontend/public/narration/` matching each step ID:
   - `intro-priya.mp3`
   - `api-break-triggered.mp3`
   - `drift-diagnosed.mp3`
   - `code-written-review.mp3`
   - `safe-test-passed.mp3`
   - `human-approval-pr.mp3`
   - `memory-heal-second-app.mp3`
   - `summary-comparison.mp3`
   Set `VITE_NARRATION=audio` in `.env`.

---

## How Data Flows

Every piece of data flows through a strict one-way architectural pipeline:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────────────────┐
│ Page / Stage │ ──> │ Custom Hook  │ ──> │  apiClient   │ ──> │ mockClient (in-memory)│
│ (JSX Views)  │     │(TanStack Q.) │     │ (Interface)  │     │   or httpClient (REST)│
└──────────────┘     └──────────────┘     └──────────────┘     └───────────────────────┘
```

1. **Page/Component**: Renders UI, accepts user interactions (e.g. clicking "Simulate API change" or "Approve fix"). Never calls `fetch` or reads `import.meta.env` directly.
2. **Hook**: Manages state, caching, active polling, and background invalidation via TanStack Query (`useRuns`, `useRun`, `useApprove`, etc.).
3. **API Client (`apiClient`)**: Uniform contract defining all application operations (`getRuns`, `getRun`, `triggerDrift`, `approveRun`, `getHealth`).
4. **Backend Implementation**:
   - In **Mock Mode** (`VITE_USE_MOCK=true`): `mockClient.ts` reads from and mutates `mockStore.ts`, keeping all numbers unified. Real-time telemetry is streamed via `mockStream.ts`.
   - In **Real Mode** (`VITE_USE_MOCK=false`): `httpClient.ts` dispatches authentic HTTP requests to the FastAPI backend, and `sseStream.ts` streams live agent reasoning.

---

## How to Change Things

### Adding a New Breakage Scenario
1. Define the scenario in `src/mock/scenarios/<newScenario>.ts` implementing `DriftScenarioData`.
2. Register it in `src/mock/drifts.ts`.
3. Add its telemetry event progression in `src/mock/events/<newScenarioEvents>.ts` and export it in `src/mock/events.ts`.
4. Add a choice card in `src/components/demo/SimulatorControls.tsx`.

### Adding a New Screen
1. Create the page component in `src/pages/<NewPage>.tsx` (under 200 lines).
2. Register the route in `src/routes.tsx`.
3. Add the navigation item to `src/components/layout/Sidebar.tsx`.

---

## Verification & Quality Commands

```bash
# Run complete verification (lint + typecheck + test + build)
npm run check

# Run tests with Vitest
npm run test

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint
npm run lint

# Check for unused files, exports, and dependencies
npm run knip

# Build production bundle
npm run build
```
