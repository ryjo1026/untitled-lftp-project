## Goal
Establish a clean greenfield repository baseline with deterministic tooling, directory structure, and CI checks for both backend and frontend.

## Why This Phase Exists
Without a strong foundation, later phases are slowed by tooling churn, inconsistent conventions, and avoidable integration failures.

## Prerequisites
- Phase 00 accepted.
- Architecture charter and branch/PR rules are in place.
- Decision to keep existing `backend/` partial scaffolding as non-authoritative reference until replaced or validated.

## Architecture Context
This phase creates the base for two primary code surfaces:

- `backend/` for Go services and data/domain orchestration.
- `frontend/` for React UX and API/event consumers.

Contracts and operational files are first-class:
- `contracts/` for OpenAPI/event schemas.
- `deploy/` for runtime/deployment setup.
- `.github/workflows/` for CI quality gates.

## Implementation Tasks (ordered checklist)
1. Ensure top-level directories exist and are intentional:
   - `backend/`, `frontend/`, `contracts/`, `docs/`, `deploy/`, `.github/workflows/`
2. Backend bootstrap:
   - initialize `go.mod`
   - add `Makefile` targets (fmt, lint, test, integration-test, run)
   - add baseline static checks (format + vet + optional lint)
3. Frontend bootstrap:
   - scaffold React 19 + Vite + TypeScript
   - include TanStack Query, TanStack Table, `dnd-kit`, Vitest, Playwright
   - add scripts (`dev`, `build`, `test`, `test:e2e`, `lint`)
4. Repository hygiene:
   - root `.gitignore` updates for Go/Node/test artifacts
   - editor config (`.editorconfig`) and formatting conventions
5. CI skeleton:
   - backend job: setup Go, run fmt/lint/test
   - frontend job: setup Node, install, lint/test/build
   - optional contract validation job placeholder
6. Environment contract:
   - add `.env.example` with required vars and defaults
   - add `docs/environment.md` with validation policy and boot behavior

## Public APIs / Interfaces / Types changed in this phase
- Developer-facing interfaces:
  - standardized CLI entrypoints for backend/frontend checks
  - environment variable contract (names, defaults, required rules)

No product API endpoints should be implemented in this phase.

## Data Flow for this phase
`developer command -> toolchain (Go/Node) -> CI checks -> pass/fail gate before feature phases`

## Testing Tasks
1. Backend smoke:
   - `go test ./...` passes on scaffold.
2. Frontend smoke:
   - unit test runner starts and executes sample test.
   - build command succeeds.
3. CI smoke:
   - workflows parse and execute locally or in dry run.
4. Env contract test:
   - startup config validation behavior documented and exercised.

## Acceptance Criteria
- Top-level structure is complete and matches playbook.
- Backend and frontend can each run their baseline check commands.
- CI workflow skeleton exists and is functional.
- Environment variable contract exists and is documented.
- No phase-02+ feature logic is implemented yet.

## Common Failure Modes
- Adding feature code during scaffold phase.
- Tool choices diverge from playbook stack.
- Missing reproducibility (no lockfile, no pinned tool behavior).
- CI defined but not runnable.

## Handoff Prompt for Codex
```text
Implement Phase 01 from docs/phases/phase-01-repo-foundation.md.
Create/normalize repo scaffolding, backend/frontend toolchains, CI skeleton, and env contract docs.
Do not implement product endpoints or business logic yet.
Report the exact commands used for backend/frontend smoke checks and whether each acceptance criterion passed.
```

## Human Pairing Notes
- Verify dependency choices match the target architecture exactly.
- Validate generated scaffold does not import legacy code.
- Confirm CI jobs fail clearly when tests fail.
- Check that local onboarding instructions are concise and accurate.

