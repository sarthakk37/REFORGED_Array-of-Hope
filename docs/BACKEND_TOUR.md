# DriftSmith Backend Tour

This document provides the recommended reading order for exploring the DriftSmith backend codebase, with a one-line description of the architectural role of each file.

---

## 1. Contracts & Architecture Specifications
1. [`docs/API_CONTRACT.md`](file:///d:/reforged/docs/API_CONTRACT.md): The authoritative REST, SSE, and webhook contract shared between backend and frontend.
2. [`docs/DEMO_TARGET_CONTRACT.md`](file:///d:/reforged/docs/DEMO_TARGET_CONTRACT.md): The contract defining how target services structure source code, fixtures, and provider hooks.
3. [`docs/DATABASE.md`](file:///d:/reforged/docs/DATABASE.md): Mermaid entity-relationship diagram and plain-English notes for all 7 database tables.
4. [`docs/DECISIONS.md`](file:///d:/reforged/docs/DECISIONS.md): The design decisions and rationale recorded across all development phases.

---

## 2. Configuration & Startup
5. [`backend/src/driftsmith/config.py`](file:///d:/reforged/backend/src/driftsmith/config.py): Single source of truth for environment variables using Pydantic Settings.
6. [`backend/src/driftsmith/main.py`](file:///d:/reforged/backend/src/driftsmith/main.py): FastAPI application factory, CORS middleware, standardized error handling, and router registration.
7. [`backend/src/driftsmith/cli.py`](file:///d:/reforged/backend/src/driftsmith/cli.py): Typer command-line interface for running self-healing remediation directly from the terminal.

---

## 3. Core Deterministic Remediation Engine (No LLM, No Network, No DB)
8. [`backend/src/driftsmith/core/fingerprint.py`](file:///d:/reforged/backend/src/driftsmith/core/fingerprint.py): Calculates stable, deterministic hash fingerprints for schema drift signatures.
9. [`backend/src/driftsmith/core/patch_plan.py`](file:///d:/reforged/backend/src/driftsmith/core/patch_plan.py): Pydantic action models (`rename_key`, `coerce_type`, `remap_path`, `add_default`) defining declarative patch plans.
10. [`backend/src/driftsmith/core/sentinel.py`](file:///d:/reforged/backend/src/driftsmith/core/sentinel.py): Deterministic drift detector comparing baseline and drifting payloads to emit a structured `DriftReport`.
11. [`backend/src/driftsmith/core/locator.py`](file:///d:/reforged/backend/src/driftsmith/core/locator.py): Python AST visitor identifying precise source code lines accessing drifting payload attributes.
12. [`backend/src/driftsmith/core/patcher.py`](file:///d:/reforged/backend/src/driftsmith/core/patcher.py): LibCST transformer modifying consumer code to be backward compatible with both old and new payloads.

---

## 4. Database Persistence Layer (SQLAlchemy 2.0 & Alembic)
13. [`backend/src/driftsmith/db/base.py`](file:///d:/reforged/backend/src/driftsmith/db/base.py): Base class for declarative SQLAlchemy ORM models.
14. [`backend/src/driftsmith/db/models.py`](file:///d:/reforged/backend/src/driftsmith/db/models.py): Database models for users, runs, sequence-ordered events, drift reports, patches, PRs, and learned patterns.
15. [`backend/src/driftsmith/db/session.py`](file:///d:/reforged/backend/src/driftsmith/db/session.py): Database engine creation, thread connection arguments, and transactional session management.
16. [`backend/src/driftsmith/db/repositories/users.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/users.py): User entity queries and password credential management.
17. [`backend/src/driftsmith/db/repositories/runs.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/runs.py): Remediation run lifecycle updates, statistics tracking, and summary conversions.
18. [`backend/src/driftsmith/db/repositories/events.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/events.py): Sequence-ordered run event persistence preserving timeline history across restarts.
19. [`backend/src/driftsmith/db/repositories/patterns.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/patterns.py): Pattern lookup, persistence, and usage counter increments for zero-inference healing.
20. [`backend/src/driftsmith/db/repositories/patches.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/patches.py): Persistence of diagnosed drift reports and verified code diffs.
21. [`backend/src/driftsmith/db/repositories/pull_requests.py`](file:///d:/reforged/backend/src/driftsmith/db/repositories/pull_requests.py): Tracking of pull request previews, branches, and publication state.

---

## 5. AI Agents & LLM Replay Engine
22. [`backend/src/driftsmith/ai/cache.py`](file:///d:/reforged/backend/src/driftsmith/ai/cache.py): SHA256 prompt hashing and response file caching for deterministic offline execution.
23. [`backend/src/driftsmith/ai/llm_client.py`](file:///d:/reforged/backend/src/driftsmith/ai/llm_client.py): Multi-mode client dispatching across live Google GenAI SDK, replay cache, and scripted mocks.
24. [`backend/src/driftsmith/ai/agents/triage.py`](file:///d:/reforged/backend/src/driftsmith/ai/agents/triage.py): Triage agent formulating root-cause explanations and operational risk assessments.
25. [`backend/src/driftsmith/ai/agents/coder.py`](file:///d:/reforged/backend/src/driftsmith/ai/agents/coder.py): Coder agent formulating declarative `PatchPlan` specifications.
26. [`backend/src/driftsmith/ai/agents/critic.py`](file:///d:/reforged/backend/src/driftsmith/ai/agents/critic.py): Critic agent analyzing sandbox failures and providing actionable remediation guidance.

---

## 6. External Integrations
27. [`backend/src/driftsmith/integrations/sandbox_runner.py`](file:///d:/reforged/backend/src/driftsmith/integrations/sandbox_runner.py): Ephemeral test sandbox verifying dual-payload contracts with strict timeouts.
28. [`backend/src/driftsmith/integrations/github_client.py`](file:///d:/reforged/backend/src/driftsmith/integrations/github_client.py): Pull request preview generator and live GitHub PR creation adapter.
29. [`backend/src/driftsmith/integrations/slack_client.py`](file:///d:/reforged/backend/src/driftsmith/integrations/slack_client.py): Outbound Slack alert dispatcher with automatic dry-run fallback.
30. [`backend/src/driftsmith/integrations/n8n_hooks.py`](file:///d:/reforged/backend/src/driftsmith/integrations/n8n_hooks.py): Outbound webhook notifier signaling run completion to n8n workflows.

---

## 7. Domain Services & Pipeline Orchestration
31. [`backend/src/driftsmith/services/event_bus.py`](file:///d:/reforged/backend/src/driftsmith/services/event_bus.py): In-process pub/sub event bus streaming events to SSE and persisting to SQLite.
32. [`backend/src/driftsmith/services/target_registry.py`](file:///d:/reforged/backend/src/driftsmith/services/target_registry.py): Dynamic target service loader enforcing path traversal boundaries and payload extraction.
33. [`backend/src/driftsmith/services/pipeline.py`](file:///d:/reforged/backend/src/driftsmith/services/pipeline.py): The 5-stage closed-loop heal loop implementing memory lookups, agent retries, and sandbox verification.
34. [`backend/src/driftsmith/services/run_service.py`](file:///d:/reforged/backend/src/driftsmith/services/run_service.py): Initiator for remediation runs in asynchronous background worker threads.
35. [`backend/src/driftsmith/services/approval_service.py`](file:///d:/reforged/backend/src/driftsmith/services/approval_service.py): Service executing human review approvals and promoting pull requests to open status.

---

## 8. Authentication & API Routers
36. [`backend/src/driftsmith/auth/passwords.py`](file:///d:/reforged/backend/src/driftsmith/auth/passwords.py): Bcrypt salt generation and password verification.
37. [`backend/src/driftsmith/auth/tokens.py`](file:///d:/reforged/backend/src/driftsmith/auth/tokens.py): Cryptographic JWT access token signing and claims verification.
38. [`backend/src/driftsmith/auth/permissions.py`](file:///d:/reforged/backend/src/driftsmith/auth/permissions.py): Role-based access control gates protecting approval endpoints.
39. [`backend/src/driftsmith/auth/api_keys.py`](file:///d:/reforged/backend/src/driftsmith/auth/api_keys.py): Machine authentication validator for external webhook ingestion.
40. [`backend/src/driftsmith/api/deps.py`](file:///d:/reforged/backend/src/driftsmith/api/deps.py): FastAPI dependency injectors resolving current user profile and database sessions.
41. [`backend/src/driftsmith/api/schemas.py`](file:///d:/reforged/backend/src/driftsmith/api/schemas.py): Pydantic DTO models mirroring the contract without raw dictionaries.
42. [`backend/src/driftsmith/api/routers/auth.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/auth.py): Endpoint handlers for `/api/auth/login` and `/api/auth/me`.
43. [`backend/src/driftsmith/api/routers/runs.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/runs.py): Endpoint handlers for `/api/runs`, `/api/runs/{id}`, `/api/runs/{id}/approve`, and `/api/runs/simulate`.
44. [`backend/src/driftsmith/api/routers/events.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/events.py): Server-Sent Events endpoint streaming real-time agent execution logs.
45. [`backend/src/driftsmith/api/routers/patterns.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/patterns.py): Telemetry endpoint returning learned patterns and zero-inference fixes.
46. [`backend/src/driftsmith/api/routers/demo.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/demo.py): Simulation endpoint for the frontend interactive live stage.
47. [`backend/src/driftsmith/api/routers/webhooks.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/webhooks.py): Ingestion endpoints for n8n orchestrations and external incident alerts.
48. [`backend/src/driftsmith/api/routers/health.py`](file:///d:/reforged/backend/src/driftsmith/api/routers/health.py): Truthful subsystem health inspection reporting live, dry-run, and mock states.
