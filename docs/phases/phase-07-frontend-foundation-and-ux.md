## Goal
Implement the React frontend shell and core UX flows, including bulk actions, drag/drop queue reorder, realtime updates, and mobile-first interaction simplification.

## Why This Phase Exists
The rewrite must materially improve usability (bulk editing, queue ordering, fewer clicks, mobile behavior). This phase delivers that user-facing value on top of stable backend contracts.

## Prerequisites
- Phase 06 accepted.
- API and event contracts are stable.
- Backend endpoints are functional in dev environment.

## Architecture Context
Frontend architecture:
- typed API client generated or aligned from OpenAPI
- centralized query/cache layer (TanStack Query)
- event subscription layer for realtime updates
- feature modules:
  - transfers
  - settings
  - autoqueue
  - logs

UX architecture:
- transfer list as primary workspace
- multi-select model with persistent bulk action bar
- row-level one-tap actions
- drag/drop reorder with optimistic update + rollback
- mobile-first breakpoints and sticky controls

## Implementation Tasks (ordered checklist)
1. Build app shell and routing with feature pages:
   - dashboard/transfers
   - settings
   - autoqueue
   - logs
2. Implement typed API client and data models from contracts.
3. Implement WebSocket event subscription and cache integration.
4. Transfers feature:
   - table/card hybrid list
   - multi-select state and batch selection controls
   - sticky bulk action bar
   - one-tap row action menu
5. Queue reorder UX:
   - `dnd-kit` drag/drop interactions
   - optimistic reorder mutation
   - rollback on API failure
6. Settings/autoqueue/logs pages against v2 endpoints.
7. Mobile-first layout refinements:
   - breakpoint strategy
   - touch targets and spacing
   - avoid hidden critical controls
8. Add UX notes in `docs/frontend-ux-decisions.md` for future contributors.

## Public APIs / Interfaces / Types changed in this phase
- Frontend type layer bound to OpenAPI and event schema.
- UI state interfaces for:
  - multi-selection
  - bulk action request/response
  - reorder mutation and rollback semantics

No new backend API should be invented in this phase; align to phase 04 contracts.

## Data Flow for this phase
`user interaction -> frontend state -> API mutation -> backend state/event -> query cache update -> UI render`

`websocket event -> event adapter -> cache patch -> visible transfer/log/status updates`

## Testing Tasks
1. Component tests:
   - multi-select behavior
   - sticky bulk bar visibility rules
   - row action enable/disable logic
2. Interaction tests:
   - drag/drop reorder optimistic + rollback
3. Page integration tests:
   - settings/autoqueue/logs load and mutate correctly
4. Mobile viewport tests:
   - key workflows at phone widths
   - no critical action hidden or unreachable

## Acceptance Criteria
- Bulk actions are first-class and usable.
- Queue reorder works via drag/drop and persists.
- Simple tasks require fewer interactions than legacy flow.
- Mobile experience is functional and not desktop-shrunk.
- Frontend remains aligned with backend contracts.

## Common Failure Modes
- UI invents contract fields not in OpenAPI/events.
- Drag/drop updates local UI but not persistent order.
- Mobile layout hides actions behind overflow menus.
- Event updates fight with optimistic state and create flicker.

## Handoff Prompt for Codex
```text
Implement Phase 07 from docs/phases/phase-07-frontend-foundation-and-ux.md.
Build the React app shell and feature pages using typed API/event contracts, with emphasis on transfers UX: multi-select bulk actions, one-tap row actions, drag/drop reorder with optimistic update and rollback, and mobile-first behavior.
Do not introduce contract drift; report UX acceptance criteria evidence with tests/screenshots.
```

## Human Pairing Notes
- Manually run primary tasks on phone-sized viewport.
- Count clicks for common flows (queue, stop, extract, delete) versus expectations.
- Confirm bulk operation outcomes are understandable per item.
- Validate realtime updates feel stable during active transfers.

