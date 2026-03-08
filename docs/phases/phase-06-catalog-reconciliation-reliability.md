## Goal
Implement catalog reconciliation (remote/local snapshots + diff loop) and the explicit reliability subsystem (rate limiting, circuit breaker, supervision, degraded-state events).

## Why This Phase Exists
Legacy behavior showed severe warning storms and error loops. This phase directly addresses those root causes and makes resilience observable and controlled.

## Prerequisites
- Phase 05 accepted.
- Queue/jobs/provider behavior is stable.
- Event schema allows reliability and item state updates.

## Architecture Context
Catalog pipeline:
- collect local snapshot
- collect remote snapshot
- diff with persisted items
- reconcile item state and enqueue necessary updates

Reliability subsystem:
- warning coalescer/rate limiter for repeated identical failures
- circuit breaker on repeated provider/SSH class failures
- worker supervision to restart failed loops safely
- degraded-state event emission to API/UI

## Implementation Tasks (ordered checklist)
1. Define snapshot source interfaces:
   - local source
   - remote source
2. Implement periodic reconciliation loop with configurable cadence.
3. Implement diff and merge semantics:
   - upsert new items
   - mark missing/changed items accurately
   - preserve queue ordering semantics
4. Implement warning coalescing/rate limiter:
   - keyed by normalized error signature
   - suppression count in periodic summary logs
5. Implement circuit breaker:
   - failure thresholds
   - open/half-open/closed transitions
   - cooldown windows
6. Implement worker supervision:
   - detect loop exits/panics
   - restart with backoff and max restart policy
7. Emit reliability events:
   - circuit state changes
   - degraded/recovered status
   - coalesced warning summaries
8. Add reliability metrics:
   - breaker transitions
   - suppressed warning counts
   - supervisor restart counts

## Public APIs / Interfaces / Types changed in this phase
- Reliability event types added to WebSocket schema.
- Optional read model additions to transfers endpoint for degraded flags/reasons.
- Internal interfaces for snapshot providers, breaker, supervisor.

## Data Flow for this phase
`snapshot sources -> reconciler diff -> item updates + queue implications -> events`

`runtime errors -> rate limiter + breaker + supervisor -> metrics/logs/events -> UI/system visibility`

## Testing Tasks
1. Reconciliation tests:
   - add/update/remove item cases
   - idempotent repeated scans
2. Rate limiter tests:
   - repeated same warning is suppressed within window
   - summary count emitted after window
3. Circuit breaker tests:
   - threshold opens breaker
   - cooldown transitions to half-open
   - success closes breaker
4. Supervision tests:
   - worker crash triggers restart policy
   - max restart behavior is observable

## Acceptance Criteria
- Catalog loop updates items deterministically.
- Warning storm suppression is active and measured.
- Circuit breaker protects repeated failing paths.
- Worker supervision prevents silent dead loops.
- Reliability/degraded-state events are emitted and consumable.

## Common Failure Modes
- Reconciler overwrites active transfer states incorrectly.
- Coalescing hides important unique failures.
- Breaker thresholds too aggressive or too lenient.
- Supervisor restart loop thrashes without backoff.

## Handoff Prompt for Codex
```text
Implement Phase 06 from docs/phases/phase-06-catalog-reconciliation-reliability.md.
Build snapshot reconciliation and reliability primitives (warning coalescing, circuit breaker, supervision) with metrics and events.
Use legacy log storm patterns as test fixtures for suppression behavior.
Provide tests and metrics evidence that repeated failures no longer create uncontrolled log floods or process instability.
```

## Human Pairing Notes
- Manually inspect logs under fault injection for readability and suppression summaries.
- Validate degraded-state signals are user-actionable.
- Tune circuit-breaker thresholds using realistic failure replay.
- Ensure reconciliation does not reorder user-managed queue positions.

