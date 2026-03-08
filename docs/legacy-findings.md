# Legacy Findings: SeedSync v1 (Reference-Only)

## Goal of This Document
Capture objective findings from the legacy project and flattened logs so v2 design choices remain evidence-driven. This is not a migration plan and does not imply compatibility obligations.

## Sources Reviewed
- Legacy codebase under `src/python` and `src/angular`
- Flattened logs from `/Users/ryan/Downloads/out/`:
  - `flat.log`
  - `grouped.log`
  - `signal.log`
  - `codex_context.txt`
  - `codex_context_exact.txt`

Primary observed window in logs:
- First event: `2025-11-14`
- Last event: `2026-03-08`

## Quantified Reliability Signals
From `flat.log` (192,314 lines):

| Signal | Count | Notes |
|---|---:|---|
| `Path does not exist` | 51,585 | High-frequency scanner warnings, often repeating once per second for the same path. |
| `Caught an SshcpError` | 33,150 | Dominated by repeated remote scan failures and auth/host/timeout errors. |
| `Input/output error` | 131,148 | Large repeating error class associated with remote scan/script and shell startup paths. |
| `Lftp detected error` | 9 | Rare but high impact; can trigger crash path in legacy flow. |
| `Caught exception in job ControllerJob` | 3 | Controller thread crash events observed. |
| `MainProcess/MainThread - Caught exception` | 3 | Main process exception propagation after controller failure. |
| `Lftp timeout exception` | 3 | Timeout bursts observed around active transfer operations. |
| `Received a restart action` | 4 | Manual restarts used as operator recovery action. |

Additional context:
- Mobile traffic exists (`iPhone`/`Mobile` user agents observed), confirming mobile UX is a real usage path.

## Root-Cause Findings (Legacy Architecture)

### 1) Error Storm from Active Scanner
Observed symptom:
- Repeated `Path does not exist` warnings for the same item with high frequency.

Likely source path:
- Active file scan loop repeatedly attempts file lookup for transient or stale active entries.

Impact:
- Log noise obscures actionable failures.
- Operational diagnostics become expensive and error-prone.

### 2) Remote Scanner Failure Loop
Observed symptom:
- Massive `Caught an SshcpError` volume.
- Errors include: input/output, timeout, bad hostname, incorrect password.

Likely source path:
- Remote scan execution over SSH/SCP repeatedly retried without strong degradation strategy.

Impact:
- Persistent remote issues generate continuous warning volume.
- System appears unstable even when core process remains alive.

### 3) Transfer Provider Errors Can Escalate to Process-Level Failure
Observed symptom:
- `Lftp detected error` followed by `ControllerJob` exception and main-thread exception handling.

Likely source path:
- Pending lftp errors are raised in controller processing path and can propagate to job/main process.

Impact:
- Single transfer provider fault can break overall service continuity.
- Requires manual restart for recovery in some cases.

### 4) Extraction Failure Handling Exists but is Operationally Noisy
Observed symptom:
- Extraction failures (`7z`/archive errors) logged repeatedly.

Likely source path:
- Failed extraction attempts are captured but can retrigger under auto flows.

Impact:
- Not process-fatal, but creates repeated failure signals unless bounded and deduplicated.

### 5) UX Friction Confirmed by Code Shape
Observed symptom:
- Legacy UI actions are largely single-item, selection-driven row workflows.
- Queue reorder is not first-class.
- Bulk editing is not first-class.

Likely source path:
- Per-item command endpoints and row action model; no durable queue-order mutation model.

Impact:
- Excessive clicks for common tasks.
- Lower usability on mobile.

## Mapping Findings to v2 Controls

| Legacy finding | v2 control | Phase(s) |
|---|---|---|
| Scanner warning storms | Warning coalescing/rate-limiting by normalized error signature, suppression summaries | 06, 08 |
| Remote scan repetitive failures | Circuit breaker + degraded-state model + supervised restart/backoff | 06, 08 |
| Provider fault can crash service | Job-level failure isolation; provider errors recorded in attempts, never process-fatal | 05, 08 |
| Repeated extraction failures | Deterministic extraction state model + retry policy + terminal error semantics | 05, 08 |
| Poor bulk/ordering UX | Bulk action API + drag/drop reorder + mobile-first sticky controls | 04, 07 |

## What v2 Should Preserve vs Replace

Preserve functional intent:
- Discover remote/local items.
- Queue/stop/download/extract/delete operations.
- Autoqueue patterns.
- Logs and settings surfaces.

Replace implementation model:
- Legacy thread/process/loop coupling.
- Legacy ad-hoc SSE stream contract shape.
- Per-item action emphasis without durable bulk/order model.
- Weak failure isolation around transfer-provider errors.

## Design Consequences for v2
1. State durability is mandatory: queue/job/attempt/order all persisted in SQLite.
2. Provider abstraction is mandatory: `lftp` adapter behind stable interface.
3. Reliability telemetry is mandatory: breaker transitions, suppressed warnings, retries, degraded events.
4. API contract-first is mandatory: OpenAPI + event schema as source of truth.
5. UX simplification is mandatory: bulk-first, reorder-first, mobile-first.

## Validation Targets Derived from Findings
- No unhandled backend panic under repeated transfer/provider/scanner faults.
- Repeated identical scanner/provider failures are visibly coalesced, not spammed linearly.
- Queue order survives restart and reorder operations are atomic.
- Bulk API reports per-item outcomes reliably.
- Mobile workflows expose all critical actions without hidden dependencies.

