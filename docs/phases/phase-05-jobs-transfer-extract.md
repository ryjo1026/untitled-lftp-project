## Goal
Implement queue orchestration, transfer provider abstraction with `LftpProvider`, and extract worker pool with durable retries and deterministic status transitions.

## Why This Phase Exists
This phase replaces the legacy failure pattern where provider errors propagated to process-level crashes. Job-level isolation and persistence must be established before catalog or frontend feature completion.

## Prerequisites
- Phase 04 accepted.
- Contracts and handlers are stable.
- Phase 02 repositories support queue/job/attempt persistence.

## Architecture Context
Orchestration components:
- queue orchestrator: consumes actions and schedules jobs.
- worker pool: bounded concurrency for transfer/extract execution.
- transfer provider interface: pluggable backend (`lftp` now).
- extraction service: deterministic statuses and failure capture.

Reliability rules:
- provider failures are recorded in `job_attempts`.
- retries use backoff policy.
- terminal failure updates job/item state and emits event.
- no provider failure causes backend process termination.

## Implementation Tasks (ordered checklist)
1. Define domain job/action model and state machine:
   - actions: queue/stop/extract/delete-local/delete-remote
   - states: pending/running/succeeded/failed/retrying/cancelled
2. Implement queue orchestrator service:
   - durable job creation from bulk actions
   - bounded worker scheduling
   - retries with backoff
3. Define transfer provider interface:
   - `Queue(ctx, item)`
   - `Stop(ctx, item)`
   - `DeleteLocal(ctx, item)`
   - `DeleteRemote(ctx, item)`
   - optional status/health methods
4. Implement `LftpProvider` adapter:
   - command execution and error mapping
   - classify retryable vs non-retryable failures
5. Implement extract worker pool:
   - bounded concurrency
   - deterministic transition updates
   - attempt logging and final status persistence
6. Integrate orchestrator with API handlers:
   - `POST /api/v2/transfers/actions`
   - `POST /api/v2/queue/reorder` side effects where needed
7. Emit job and item state events over event hub.
8. Add metrics around job throughput, failures, retries, and durations.

## Public APIs / Interfaces / Types changed in this phase
- Transfer provider interface introduced as stable backend extension point.
- API behavioral contract finalized for bulk action asynchronous completion semantics.
- Event payload types expanded with job lifecycle updates.

## Data Flow for this phase
`bulk action API -> job rows created -> worker picks job -> provider/extract execution -> attempt row write -> state transition -> event publish -> API/UI observes new state`

## Testing Tasks
1. Unit tests:
   - state machine transition legality
   - retry backoff policy
   - provider error classification
2. Integration tests:
   - mixed bulk actions produce per-item job histories
   - retries recorded and terminal states consistent
3. Fault tests:
   - simulated lftp timeout/missing file errors
   - provider failures do not crash process
4. Metrics tests:
   - job counters/histograms update for success/failure/retry.

## Acceptance Criteria
- Queue orchestrator persists and executes jobs with bounded workers.
- Transfer provider abstraction exists with working `LftpProvider`.
- Extract jobs run through deterministic state transitions.
- Retries and attempts are persisted and queryable.
- Provider failures are isolated to jobs; backend stays healthy.

## Common Failure Modes
- Hidden synchronous execution in handlers (no durable queue).
- Retry loops without terminal condition.
- Inconsistent state updates between `jobs` and `items`.
- Provider-specific errors leaking as generic unknown failures.

## Handoff Prompt for Codex
```text
Implement Phase 05 from docs/phases/phase-05-jobs-transfer-extract.md.
Build durable queue orchestration, bounded workers, retry/backoff, transfer provider interface with LftpProvider, and extract workers.
Ensure provider/extract failures only affect jobs and never crash the process.
Return tests for retry behavior, error classification, and process stability under injected provider faults.
```

## Human Pairing Notes
- Verify async behavior from API perspective (no blocking on long jobs).
- Inspect job_attempt records for complete forensic traceability.
- Validate retry policy values against realistic failure behavior.
- Ensure extracted/deleted/queued states cannot be represented ambiguously.

