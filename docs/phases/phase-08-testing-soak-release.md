## Goal
Finalize quality gates, end-to-end validation, soak/fault testing, and release readiness for a big-bang replacement rollout.

## Why This Phase Exists
The project’s core complaint is reliability. This phase proves the rewrite under stress and prevents shipping an unstable “v2”.

## Prerequisites
- Phases 00-07 accepted.
- Feature-complete backend and frontend available in integration environment.
- Fault injection hooks for provider/network/scanner failure simulation.

## Architecture Context
Quality strategy is layered:
- unit tests for deterministic business logic
- integration tests for cross-module correctness
- frontend/e2e tests for real user workflows
- soak tests for long-running reliability under injected faults

Release gates are explicit and binary. “Mostly works” is not accepted.

## Implementation Tasks (ordered checklist)
1. Build backend unit test suite for:
   - config validation
   - queue ordering invariants
   - retry policy and state transitions
   - provider error classification
2. Build backend integration suite for:
   - queue lifecycle from API to terminal states
   - reorder atomicity and persistence
   - extraction failure and recovery behavior
   - reconciliation and reliability loops
3. Build frontend unit/integration tests for:
   - bulk actions
   - reorder optimistic behavior
   - mobile rendering and interactions
4. Build Playwright e2e suite for full workflows:
   - transfers queue/stop/extract/delete
   - settings and autoqueue edits
   - logs visibility and realtime updates
5. Implement soak/fault-injection harness:
   - sustained runtime (24h target)
   - injected timeout, missing remote chunk, auth failure patterns
   - record crash-free and degraded/recovery metrics
6. Define and enforce release gates in CI:
   - required jobs
   - pass/fail thresholds
7. Create release runbook in `docs/release-runbook.md`:
   - deployment steps
   - rollback steps
   - post-deploy verification checklist

## Public APIs / Interfaces / Types changed in this phase
- No new product APIs expected.
- Test interfaces/harness contracts may be added for fault injection and deterministic fixtures.

## Data Flow for this phase
`code changes -> CI test matrix -> fault/soak runs -> gate evaluation -> release decision`

`fault injection -> runtime behavior -> metrics/log/events -> assertion of resilience outcomes`

## Testing Tasks
1. Coverage and critical-path assertions for backend and frontend.
2. Contract tests remain green against OpenAPI/events schema.
3. Long-run soak tests complete without process crash.
4. Failure injection confirms:
   - no unhandled panic
   - retries and breaker behavior as designed
   - user-visible degraded/recovered signaling

## Acceptance Criteria
- No unhandled backend panic during fault injection.
- Queue order remains consistent across restarts.
- Bulk API returns deterministic per-item outcomes.
- Mobile UI keeps critical controls visible and usable.
- Soak test completes with zero process crashes and acceptable error recovery behavior.

## Common Failure Modes
- Passing unit tests but failing long-run stability.
- Flaky e2e due weak synchronization on realtime events.
- Reliability controls enabled but not observable in metrics/events.
- Release runbook missing rollback realism.

## Handoff Prompt for Codex
```text
Implement Phase 08 from docs/phases/phase-08-testing-soak-release.md.
Complete the full test matrix (unit, integration, e2e), build a fault/soak harness, and enforce release gates.
Prioritize proving crash-free behavior under repeated provider/network/scanner failures.
Produce a release runbook and summarize gate results against each acceptance criterion.
```

## Human Pairing Notes
- Manually inspect soak logs for repeated-error readability, not just pass/fail.
- Validate rollback steps in a dry run before first real cutover.
- Review flaky tests aggressively; do not normalize intermittent failures.
- Confirm acceptance criteria map to real user risk, not only coverage metrics.

