## Goal
Lock architectural rules, delivery boundaries, and collaboration agreements before any substantive implementation, so all later phases remain consistent with the greenfield rewrite intent.

## Why This Phase Exists
The legacy app had reliability and operability issues rooted in architecture and process coupling. If phase 0 is skipped, implementation work drifts toward accidental legacy reuse, inconsistent decisions, and unstable interfaces.

## Prerequisites
- Read [docs/legacy-findings.md](/Users/ryan/development/seedsync/docs/legacy-findings.md).
- Agree on target: React + TypeScript frontend, Go backend, SQLite, pluggable transfer provider with `lftp` first.
- Confirm rewrite assumptions:
  - big-bang cutover
  - no migration/import from legacy state
  - single-user local-first

## Architecture Context
Target architecture is service-oriented inside one deployable backend:

- API layer: versioned HTTP + WebSocket events.
- Domain layer: queue orchestration, job lifecycle, catalog reconciliation, extract workflows.
- Infrastructure layer: SQLite persistence, transfer provider adapter, reliability controls, metrics/tracing/logging.
- Frontend: API-driven React app with realtime updates and mobile-first interaction model.

Core guardrails:
- Provider abstraction at transfer boundary.
- DB-first durability for queue/order/job state.
- Failures are isolated to jobs/workers, never process-fatal.
- Contracts are explicit (OpenAPI + event schema), not inferred from implementation.

## Implementation Tasks (ordered checklist)
1. Write a short architecture charter (`docs/architecture-charter.md`) that states:
   - non-negotiables
   - out-of-scope items
   - required reliability controls
2. Create ADR template and directory (`docs/adr/`) for decisions that affect future phases.
3. Define branch/PR conventions for this rewrite:
   - branch prefix `codex/phase-xx-*`
   - single-phase PR scope
   - max PR size guideline
4. Define phase gate policy:
   - no phase transition without explicit acceptance criteria pass
   - no skipping testing tasks
5. Record legacy root-cause to v2-control mapping in a one-page matrix:
   - log storms -> warning coalescing/rate limiting
   - provider errors -> retryable job failures
   - process crashes -> supervision and circuit breaker
6. Publish a repo-level “Definition of Done” checklist referenced by all phases.

## Public APIs / Interfaces / Types changed in this phase
- None. This phase defines governance and architecture constraints only.

## Data Flow for this phase
`legacy findings + rewrite assumptions -> architecture charter -> ADR baseline -> phase gates -> implementation constraints for phases 01-08`

## Testing Tasks
1. Verify each non-negotiable appears in both:
   - architecture charter
   - phase README
2. Validate phase gate checklist is explicit and unambiguous.
3. Validate ADR template captures:
   - decision
   - alternatives
   - consequences

## Acceptance Criteria
- Architecture charter exists and is approved.
- ADR process exists and is usable.
- Rewrite assumptions are explicitly documented and consistent with this playbook.
- Team workflow rules (branching/PR/gates) are documented.
- Legacy root-cause mapping to v2 controls is recorded.

## Common Failure Modes
- “Quick win” implementation starts before rule lock.
- Hidden legacy compatibility assumptions sneak into API/model decisions.
- Reliability requirements are deferred and become retrofits.
- PR scope spills across multiple phases, causing rework.

## Handoff Prompt for Codex
```text
Implement Phase 00 from docs/phases/phase-00-orientation-and-rules.md.
Create the phase artifacts (architecture charter, ADR template/process, phase-gate checklist, and legacy-root-cause-to-v2-control matrix).
Do not implement backend/frontend features yet.
Keep output focused on governance and architecture constraints, and report acceptance criteria status item-by-item.
```

## Human Pairing Notes
- Challenge any statement that implies legacy API compatibility.
- Ensure failure isolation is a hard requirement, not “best effort”.
- Ensure written rules are short and enforceable, not aspirational.
- Require at least one explicit “what we will not do” list.

