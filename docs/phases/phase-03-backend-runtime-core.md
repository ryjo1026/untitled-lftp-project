## Goal
Implement backend runtime bootstrap and core infrastructure modules so the service can start reliably, expose health/readiness/metrics, and shut down gracefully.

## Why This Phase Exists
Operational stability starts with startup/shutdown correctness and observability. Feature work before runtime fundamentals leads to fragile behavior under real load and failures.

## Prerequisites
- Phases 01 and 02 accepted.
- Schema/migrations/repositories are available.
- Env contract includes all runtime-required values.

## Architecture Context
Core backend runtime composition:
- `config`: strict load + validation, fail-fast on invalid input.
- `logging`: structured logger with consistent fields.
- `db`: open, migrate, and managed lifecycle.
- `events`: in-process pub/sub for API/WebSocket fanout.
- `observability`: metrics and tracing wiring.
- `app`: dependency wiring and lifecycle control.

Startup must be deterministic:
1. load config
2. initialize logger
3. initialize db + apply migrations
4. initialize modules
5. start HTTP server and background loops

## Implementation Tasks (ordered checklist)
1. Implement `cmd/seedsyncd/main.go` as the only runtime entrypoint.
2. Build `internal/app` composition root:
   - dependency construction
   - start/stop orchestration
   - signal handling (`SIGINT`, `SIGTERM`)
3. Enforce config validation and startup fail-fast policy.
4. Add DB open/migrate lifecycle and close handling.
5. Add event hub abstraction for topic publish/subscribe.
6. Wire observability:
   - Prometheus metrics endpoint
   - tracing provider initialization placeholder
7. Add baseline HTTP endpoints:
   - `GET /api/v2/health`
   - `GET /api/v2/ready`
8. Add optional deterministic startup seed flow for local development.
9. Document runtime lifecycle and failure behavior in `docs/runtime.md`.

## Public APIs / Interfaces / Types changed in this phase
- Public endpoints introduced:
  - `GET /api/v2/health`
  - `GET /api/v2/ready`
- Runtime service interfaces:
  - app lifecycle (`Start`, `Stop`, `Wait`)
  - event hub publish/subscribe contracts

## Data Flow for this phase
`process start -> config validate -> dependencies initialize -> server start -> health/readiness reflect module states -> signal -> graceful shutdown`

## Testing Tasks
1. Startup tests:
   - invalid config fails before server start.
   - missing/invalid DB path behavior is explicit.
2. Lifecycle tests:
   - graceful shutdown drains in-flight routines.
3. Endpoint tests:
   - health/readiness reflect expected states.
4. Observability tests:
   - metrics endpoint exports expected counters/gauges.

## Acceptance Criteria
- Service boots from main entrypoint with deterministic lifecycle.
- Health and readiness endpoints function correctly.
- DB migration is applied automatically at startup.
- Graceful shutdown works under active workload.
- Logging and metrics are visible and consistent.

## Common Failure Modes
- Readiness always true even when critical modules are down.
- Startup order races (handlers started before dependencies ready).
- Silent config fallback causing unexpected runtime behavior.
- Shutdown leaks goroutines or leaves DB locks open.

## Handoff Prompt for Codex
```text
Implement Phase 03 from docs/phases/phase-03-backend-runtime-core.md.
Focus on bootstrap/lifecycle infrastructure: main entrypoint, app wiring, config validation, DB+migration startup, health/readiness, metrics, and graceful shutdown.
Do not implement feature handlers yet except health/readiness.
Return test evidence for startup failure paths and shutdown correctness.
```

## Human Pairing Notes
- Manually test Ctrl+C behavior while service is busy.
- Verify readiness semantics are meaningful, not placeholders.
- Inspect logs for startup order clarity and root-cause diagnostics.
- Ensure no hidden dependency init occurs inside handlers.

