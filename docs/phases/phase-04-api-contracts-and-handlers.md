## Goal
Define and implement stable v2 API contracts and handlers, including WebSocket event contracts, with explicit validation and error semantics.

## Why This Phase Exists
Contracts must be stable before major worker/service implementation and frontend wiring. This prevents backend/frontend drift and ad-hoc response shapes.

## Prerequisites
- Phase 03 accepted.
- Runtime server infrastructure is operational.
- Repository interfaces from phase 02 are available.

## Architecture Context
API is contract-first:
- OpenAPI (`contracts/openapi.yaml`) is authoritative for HTTP.
- Event schema (`contracts/events.schema.json`) is authoritative for WebSocket payloads.
- Handler logic delegates to services; handlers do not embed business orchestration.

Error handling is standardized:
- one canonical error envelope
- consistent status mapping by error class
- bulk endpoints return per-item outcomes

## Implementation Tasks (ordered checklist)
1. Author/update `contracts/openapi.yaml` for all v2 endpoints:
   - `GET /api/v2/transfers`
   - `POST /api/v2/transfers/actions`
   - `POST /api/v2/queue/reorder`
   - `GET|POST|DELETE /api/v2/autoqueue/patterns`
   - `GET|PUT /api/v2/settings`
   - `GET /api/v2/logs`
   - `GET /api/v2/health`
   - `GET /api/v2/ready`
2. Author/update `contracts/events.schema.json`:
   - event envelope
   - transfer state events
   - queue reorder/state events
   - reliability/degraded-state events
   - log stream events
3. Implement HTTP handlers with:
   - request validation
   - response serialization
   - canonical error envelope
4. Implement WebSocket endpoint:
   - connection lifecycle handling
   - subscription model (single-user local-first defaults)
   - heartbeat/ping strategy
5. Define and implement per-item bulk action result schema.
6. Add API docs generation/export step if desired.
7. Add `docs/api-contract-notes.md` for versioning and compatibility policy.

## Public APIs / Interfaces / Types changed in this phase
- Stable public HTTP API introduced under `/api/v2/*`.
- Stable WebSocket event contract introduced at `/api/v2/events`.
- Canonical error envelope type introduced and used across handlers.
- Bulk action response type with per-item result list introduced.

## Data Flow for this phase
`HTTP request -> handler validation -> service call -> repository/queue action -> response envelope`

`state change -> event hub publish -> websocket broadcaster -> typed event payload to frontend`

## Testing Tasks
1. Contract tests:
   - endpoint responses conform to OpenAPI examples/schema.
2. Handler tests:
   - validation errors map to canonical envelope.
3. WebSocket tests:
   - connect, receive events, heartbeat, disconnect behavior.
4. Bulk action tests:
   - mixed success/failure returns deterministic per-item results.

## Acceptance Criteria
- OpenAPI and event schema exist and match implementation.
- All listed endpoints are implemented and routable.
- Canonical error envelope is consistently used.
- WebSocket endpoint emits schema-valid events.
- Bulk action semantics are explicit and tested.

## Common Failure Modes
- Contract and implementation diverge after edits.
- Handlers leak internal errors without envelope mapping.
- WebSocket sends ad-hoc payloads not covered by schema.
- Bulk endpoint short-circuits entire request on one item failure.

## Handoff Prompt for Codex
```text
Implement Phase 04 from docs/phases/phase-04-api-contracts-and-handlers.md.
Use contract-first development: finalize contracts/openapi.yaml and contracts/events.schema.json first, then implement handlers and websocket endpoint to match.
Apply canonical error envelope and per-item bulk result semantics everywhere.
Provide tests proving contract conformance and websocket behavior.
```

## Human Pairing Notes
- Manually read OpenAPI and spot-check against real responses.
- Confirm error envelope fields are always present on failures.
- Validate bulk response shape is easy for frontend optimistic updates.
- Ensure no implicit auth assumptions conflict with single-user local-first.

