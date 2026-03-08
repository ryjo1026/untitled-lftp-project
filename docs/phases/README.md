# SeedSync v2 Phase Playbook

## Purpose
This playbook breaks the greenfield rewrite into explicit phases that you can implement with AI support without losing architectural direction. Each phase file is both:

- a teaching guide for you (context, failure modes, review notes)
- an execution contract for Codex (ordered tasks, acceptance criteria, handoff prompt)

Read phases in order. Do not start a phase until the prior phase acceptance criteria are met.

## Phase Order
1. `phase-00-orientation-and-rules.md`
2. `phase-01-repo-foundation.md`
3. `phase-02-data-model-and-migrations.md`
4. `phase-03-backend-runtime-core.md`
5. `phase-04-api-contracts-and-handlers.md`
6. `phase-05-jobs-transfer-extract.md`
7. `phase-06-catalog-reconciliation-reliability.md`
8. `phase-07-frontend-foundation-and-ux.md`
9. `phase-08-testing-soak-release.md`

## Dependency Graph
```mermaid
graph TD
  P00["Phase 00: Orientation & Rules"] --> P01["Phase 01: Repo Foundation"]
  P01 --> P02["Phase 02: Data Model & Migrations"]
  P01 --> P03["Phase 03: Backend Runtime Core"]
  P02 --> P03
  P03 --> P04["Phase 04: API Contracts & Handlers"]
  P04 --> P05["Phase 05: Jobs, Transfer, Extract"]
  P03 --> P06["Phase 06: Catalog + Reliability"]
  P05 --> P06
  P04 --> P07["Phase 07: Frontend Foundation + UX"]
  P06 --> P07
  P05 --> P08["Phase 08: Testing, Soak, Release"]
  P06 --> P08
  P07 --> P08
```

## Working Method with AI
1. Start each phase by pasting that phase’s “Handoff Prompt for Codex”.
2. Keep PRs scoped to one phase only.
3. Block merges if any acceptance criterion in the phase file is unmet.
4. Capture deviations in `docs/adr/` as short architecture decisions.
5. If an implementation choice would impact a later phase contract, update this playbook first, then implement.

## Definition of Done (Per Phase)
- Ordered implementation checklist is complete.
- Testing tasks for that phase are passing.
- Acceptance criteria are all true.
- Human pairing review items were checked manually.
- Any discovered cross-phase constraints were documented.

## Non-Negotiables
- Greenfield architecture: no compatibility coupling to legacy internals.
- No migration/import of legacy persisted state.
- Single-user local-first target.
- Big-bang replacement trajectory.
- `lftp` provider first, behind a stable transfer interface.

