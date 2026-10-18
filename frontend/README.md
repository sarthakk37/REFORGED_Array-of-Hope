# DriftSmith Frontend Cockpit

DriftSmith is an autonomous self-healing agent for third-party API changes. When an upstream payment or SaaS provider changes their API without warning, DriftSmith fixes your code automatically, tests the fix in a safe test room, and asks you to approve the pull request.

The user interface is designed so that anyone can understand the story within 10 seconds:
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

#### Demo Credentials:
- **Approver Role:** `approver@demo.local` / `demo1234` (Can approve fixes & preview PRs)
- **Admin Role:** `admin@demo.local` / `demo1234` (Full access)
- **Viewer Role:** `viewer@demo.local` / `demo1234` (Read-only view; approval disabled)

---

## How the Stage Works

The **Live Demo Stage** (`RemediationStage.tsx`) runs directly on the home page without requiring navigation:

1. **Step 1 ("Break something")**: Choose between three real-world API breakage scenarios:
   - **Price format changed**: Provider sent decimal string rupees (`"499.00"`) instead of integer paise (`49900`).
   - **Field renamed**: Provider renamed `amount_in_cents` to `total_amount`.
   - **Email moved**: Provider moved `customer.email` to `payer.contact.email`.
2. **Choose App**: Select `Payment app` (runs full repair loop) or `Second payment app` (instant memory fix if previously solved).
3. **5-Step Story Progress Bar**:
   - Step 1: API changed
   - Step 2: Problem found
   - Step 3: Fix written
   - Step 4: Fix tested (shows an amber **Retrying fix...** state when the Reviewer catches precision loss, followed by green success once corrected)
   - Step 5: Ready for your approval
4. **What Changed Panel**: Side-by-side BEFORE / AFTER comparison of provider JSON data with highlighted mutations.
5. **What DriftSmith is Doing**: Plain-English live log with friendly role names (**Detector**, **Investigator**, **Code writer**, **Reviewer**, **Tester**, **Reporter**) with expandable technical details.
6. **The Fix (Diff)**: Side-by-side code diff explaining why the fix works safely with both old and new data.
7. **Safe Test Results**: Two clear rows with ticks proving tests passed against both **OLD data** and **NEW data**, plus collapsible sandbox logs.
8. **Result Bar**: Highlights fix duration and AI compute consumed (e.g. `Fixed in ~22s using 4 AI calls` or glowing `Fixed in ~5s using 0 AI calls (remembered from last time)`).
9. **Approval Panel**: Approvers click **Approve and open pull request**. A 3-bullet confirmation modal ensures human sign-off, then presents a **Pull Request Preview** card with branch `driftsmith/fix-<id>`, copyable description, and zero external network calls.

---

## How Presenter Mode Works

Click the **Start guided demo** button on the home page to launch hands-free Presenter Mode:

1. **Big 20px+ Subtitle Overlay**: Displays high-contrast captions walking through Priya's payment app story step by step.
2. **Automated Actions**:
   - Triggers the `Price format changed` breakage on Priya's payment app.
   - Advances through diagnosis, code writing, reviewer retry, and safe test verification.
   - Automatically approves the fix and previews the pull request.
   - Triggers the same scenario on the `Second payment app`, showing the instant ~5s memory fix with **0 AI calls**.
   - Displays a final comparison summary card.
3. **Interactive Controls**: Presenters can pause/resume, skip to any step, exit at any moment, or toggle between **1x** and **2x** speed.

---

## How Mock Data Stays Consistent

All mock data is managed by a centralized, single-source store (`src/mock/mockStore.ts`):
- **Remembered Fixes**: Pre-seeded only for `Field renamed` and `Email moved`. When `Price format changed` finishes on the Payment app, it is dynamically saved to memory. Only then can the Second payment app heal that scenario from memory.
- **Computed Metrics**: Total fixes, times used, and AI calls saved (strictly 4 AI calls saved per remembered fix) derive directly from `mockStore.getMetrics()`. Numbers are guaranteed consistent across the home stage, recent fixes table, history archive, and Remembered Fixes page.
- **Honest System Status**: In mock mode, the System Status page truthfully identifies demo components: SQLite (demo), Gemma via Gemini API (mock mode), GitHub (dry run preview), Slack (not connected), and Safe test room (simulated in demo mode).

---

## How to Switch to the Real Backend

To connect the frontend to the real DriftSmith Python/FastAPI backend:

1. Open `frontend/.env` (or configure your deployment environment).
2. Set:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_USE_MOCK=false
   ```
3. Restart the dev server (`npm run dev`) or build the production image (`docker build -t driftsmith-frontend .`).
4. In real mode:
   - `src/api/index.ts` automatically mounts `httpClient.ts` (handling JWT Bearer auth and 401 redirects) and `sseStream.ts` (streaming chunked SSE updates via fetch ReadableStream).
   - Approvals call `POST /api/runs/{id}/approve` on the real backend with error handling and toasts.

---

## Verification & Quality Commands

```bash
# Run unit and integration test suite (29 tests)
npm run test

# Run strict TypeScript typecheck
npm run typecheck

# Run ESLint validation
npm run lint

# Build production bundle
npm run build
```
