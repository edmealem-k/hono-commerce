# Tasks: Worker Runtime Environment Decoupling

**Feature ID**: `004-worker-runtime-env-decoupling`  
**Specification**: `docs/specs/004-worker-runtime-env-decoupling/spec.md`  
**Plan**: `docs/specs/004-worker-runtime-env-decoupling/plan.md`

## Phase 1: Environment Contracts

- [x] 1.1 Add database-only environment export.
- [x] 1.2 Export the new environment entrypoint from `packages/env`.
- [x] 1.3 Remove database's dependency on `env/api`.

## Phase 2: Notification Boundary

- [x] 2.1 Remove the worker's transitive dependency on `env/api` from notification URL normalization.
- [x] 2.2 Preserve API notification URL behavior.

## Phase 3: Verification

- [x] 3.1 Start worker without API auth variables.
- [x] 3.2 Confirm API auth validation remains enforced by retaining `env/api` unchanged.
- [x] 3.3 Run `bun run verify`.
