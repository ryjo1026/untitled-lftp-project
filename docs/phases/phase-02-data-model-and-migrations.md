## Goal
Define and implement the durable DB-first state model and migration/query infrastructure that all backend behavior depends on.

## Why This Phase Exists
Queue ordering, retries, job histories, and reliability state are correctness-critical. If schema decisions are delayed, API and worker logic become unstable and costly to refactor.

## Prerequisites
- Phase 01 accepted.
- Go toolchain and CI skeleton are working.
- Environment contract includes DB path and migration execution behavior.

## Architecture Context
SQLite is the source of truth for operational state. In-memory structures are caches/queues only.

Required core tables:
- `settings`
- `items`
- `queue_items`
- `jobs`
- `job_attempts`
- `autoqueue_patterns`
- `log_events`

Persistence workflow:
- schema changes via versioned migrations
- query contracts generated/validated via sqlc
- repositories expose domain-focused operations, not raw SQL to handlers

## Implementation Tasks (ordered checklist)
1. Define SQL schema and enum strategy:
   - represent states as checked strings or constrained ints
   - enforce referential integrity and timestamps
2. Create first migration set:
   - `0001_init.up.sql`
   - `0001_init.down.sql`
3. Add migration management config and execution hooks (goose-style process).
4. Add `sqlc.yaml` and query files for each table aggregate.
5. Implement repository interfaces mapped to domain operations:
   - queue ordering operations
   - job creation and attempt recording
   - item upsert and state reads
   - settings and patterns CRUD
   - log event append/read
6. Document invariants in `docs/data-model.md`:
   - queue order uniqueness and contiguous reindex policy
   - legal item and job state transitions
   - retry attempt increment and terminal conditions
7. Add transaction policy:
   - reorder operations atomic
   - bulk action creation atomic per request
   - job completion and attempt writes consistent

## Public APIs / Interfaces / Types changed in this phase
- Internal repository/service interfaces (contract for later handlers/workers).
- DB schema contract and migration/versioning policy.

No external HTTP API implementation yet.

## Data Flow for this phase
`domain intent (queue/retry/settings) -> repository method -> sqlc query -> SQLite transaction -> persisted state`

## Testing Tasks
1. Migration tests:
   - up and down work on clean DB.
   - re-apply behavior is deterministic.
2. Invariant tests:
   - queue reorder preserves unique positions.
   - illegal state transitions are rejected.
3. Repository tests:
   - jobs and attempts persist correctly.
   - bulk insert/update semantics match design.
4. Concurrency tests for reorder and job-append contention.

## Acceptance Criteria
- Core tables and constraints are implemented.
- Migration system works end-to-end.
- sqlc query surface exists for required aggregates.
- Data-model invariants are documented and tested.
- Repository layer exposes phase-03+ required operations.

## Common Failure Modes
- Missing uniqueness constraints on queue position.
- Ambiguous state semantics that leak into handler logic.
- Non-atomic reorder updates causing duplicate order values.
- Ad-hoc SQL outside repository/query contract.

## Handoff Prompt for Codex
```text
Implement Phase 02 from docs/phases/phase-02-data-model-and-migrations.md.
Create migrations, sqlc config/queries, repository interfaces/implementations, and invariant documentation/tests.
Do not add HTTP handlers yet.
Report schema decisions and how each invariant is enforced in SQL and tests.
```

## Human Pairing Notes
- Manually inspect migration SQL for constraints and indexes.
- Verify state machine rules are explicit and not implied by application code.
- Confirm queue reorder semantics are deterministic after repeated operations.
- Check down migration behavior; avoid irreversible schema mistakes early.

