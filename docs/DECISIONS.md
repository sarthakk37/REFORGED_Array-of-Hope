# DriftSmith Architectural & Design Decisions

This document tracks technical decisions made during the development of DriftSmith's frontend and client interfaces.

---

### DEC-001: Standalone Dual-Mode Client Architecture (Mock vs. HTTP)
- **Context:** DriftSmith requires a fully interactive frontend demonstration before the backend, database, and n8n orchestration layers are finalized.
- **Decision:** Implement a single `ApiClient` interface (`src/api/apiClient.ts`) backed by two implementations:
  1. `mockClient.ts` simulating realistic network delays (150-300ms), in-memory state mutations, and mock events.
  2. `httpClient.ts` making real HTTP requests with automatic Bearer token injection and centralized 401 handling.
- **Consequence:** Frontend developers and demo presenters can run the full lifecycle without running local databases or Docker containers. Switching modes requires changing only `VITE_USE_MOCK=false`.

### DEC-002: Real-Time Event Streaming Contract via `EventStream`
- **Context:** Drift diagnosis, patch generation, and sandbox testing emit continuous agent thoughts and actions.
- **Decision:** Abstract real-time streaming into an `EventStream` interface (`src/api/eventStream.ts`), with `sseStream.ts` handling real Server-Sent Events (with auth headers) and `mockStream.ts` executing simulated agent timelines with realistic interval spacing and reviewer retry attempts.
- **Consequence:** Components like `PlainLog` and `StoryProgress` remain agnostic to SSE vs mock timers.

### DEC-003: UI Design Language — The "Forge" Visual Identity
- **Context:** Default blank templates and generic purple gradient dashboards undermine technical credibility.
- **Decision:** Use a dark, industrial "forge" aesthetic:
  - Deep near-black blue-gray canvas (`#0b0f17`, `#111827`)
  - Molten amber/orange primary accent (`#f59e0b`, `#d97706`) for forge actions, sparks, and primary highlights
  - Cool cyan (`#06b6d4`) for information and thought logs
  - Emerald green (`#10b981`) for verified sandboxes and passing tests
  - Crimson red (`#ef4444`) for drift failures and regressions
  - Handcrafted SVG anvil & spark wordmark
  - JetBrains Mono for diffs, logs, and technical payloads; Inter for UI text.

### DEC-004: Handcrafted Line Diff Viewer
- **Context:** Heavy external diff dependencies introduce bundle bloat and brittle CSS conflicts.
- **Decision:** Build a custom unified and side-by-side diff renderer (`DiffViewer.tsx`, `FixDiff.tsx` + `lib/diff.ts`) that parses standard unified diff headers, highlights added/removed lines, renders line numbers, and supports unified/split views.

### DEC-005: State Management & Data Fetching
- **Context:** The app needs snappy UI updates, cache invalidation when drifts trigger or PRs get approved, and optimistic or periodic refetching.
- **Decision:** Use TanStack Query (`@tanstack/react-query`) for all remote server state, alongside React Context for authentication and active notifications.

### DEC-006: Role-Based Access Control (RBAC)
- **Context:** Drift approval involves merging code and opening PRs. Different personas (Viewer, Approver, Admin) need distinct capabilities.
- **Decision:** Implement `RoleGate.tsx` and centralized permission checks. Viewers receive read-only guidance and disabled controls with tooltips, while Approvers and Admins can trigger confirmation modals and dispatch approval requests.

### DEC-007: Plain-English Story-Driven UI over Engineering Jargon
- **Context:** Judges and non-technical stakeholders must grasp the product value within 10 seconds. Obscure jargon like "AST Dual Compat", "Hierarchy Traversal", or "cryptographic AST fingerprint" confused evaluators.
- **Decision:** Anchor all copy around the 5-step narrative:
  1. API changed
  2. Problem found
  3. Fix written
  4. Fix tested
  5. Ready for your approval
  Replace jargon with plain English: "API change", "safe test room", "Fix DriftSmith remembers", "Instant fix from memory (no AI needed)", and "Pull request (a proposed code change for your team to review)".

### DEC-008: Single-Screen Live Demo Stage Architecture
- **Context:** Requiring users to jump back and forth between dashboard tables and detail pages disrupted the live demo experience.
- **Decision:** Introduce `RemediationStage.tsx` directly on the Home Page (`DashboardPage.tsx`). Choosing an API change immediately reveals the live stage on the same screen without page navigation, while keeping full detail views reusable on `/history` and `/runs/:id`.

### DEC-009: Automated Hands-Free Presenter Mode Walkthrough
- **Context:** Live hackathon pitches require seamless, timed demonstrations without manual clicking.
- **Decision:** Build `PresenterOverlay.tsx` with high-contrast 20px+ subtitle captions, auto-playing the narrative across both the fresh repair loop (with the Reviewer retry) and the instant memory healing demo, complete with play/pause, step skipping, and 1x/2x speed controls.

### DEC-010: Zero-Network Mock Pull Request Previews and Double-Submit Guard
- **Context:** In mock mode, clicking Approve previously risked broken GitHub URLs or network errors.
- **Decision:** In mock mode, approval never invokes the network or GitHub. It renders an inline "Pull request preview" card with branch `driftsmith/fix-<id>`, copyable description, and clear preview label. Disable buttons during inflight requests to prevent double submits.

### DEC-011: Honest Subsystem Observability without Fabricated Production Claims
- **Context:** Hardcoded claims like "PostgreSQL 12 active connections" or "Anthropic Claude" misrepresented the prototype architecture.
- **Decision:** Derive all subsystem states truthfully from mock health data: SQLite (demo), Gemma via Gemini API (mock mode), GitHub (dry run preview), Slack (not connected), Safe test room (simulated in demo mode).
