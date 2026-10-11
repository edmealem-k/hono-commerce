# Feature Specification: Worker Runtime Environment Decoupling

**Feature ID**: `004-worker-runtime-env-decoupling`  
**Status**: `Implemented`  
**Architecture Reference**: `docs/architecture/storage/s3-file-lifecycle.md`  
**Target Packages**: `packages/env`, `packages/db`, `packages/notification`, `apps/worker`

## 1. Overview & Objective

The background worker currently imports the API environment schema indirectly through the database and notification packages. This makes worker startup require API-only variables such as `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`. The worker must validate only the runtime variables it actually uses.

## 2. User Stories & Acceptance Scenarios

### User Story 1: Start the worker with worker configuration

> As a developer, I want the worker to start with `apps/worker/.env`, so that unrelated API authentication configuration does not block background jobs.

- **Given** valid worker, database, Redis, and S3 variables are present
- **When** the worker starts
- **Then** it does not validate `BETTER_AUTH_SECRET` or `BETTER_AUTH_URL`
- **And** it creates the storage cleanup worker successfully.

### User Story 2: Preserve API validation

- **Given** the API starts without `BETTER_AUTH_SECRET` or `BETTER_AUTH_URL`
- **When** the API environment module loads
- **Then** API startup still fails with its existing validation error.

## 3. Invariants & Platform Guardrails (RFC 2119)

- **MUST** keep API-only authentication validation in `@hono-commerce/env/api`.
- **MUST** allow database consumers to validate only `DATABASE_URL`.
- **MUST NOT** bypass validation with `SKIP_ENV_VALIDATION` as the fix.
- **MUST NOT** expose AWS credentials to frontend applications.
- **MUST NOT** create or modify database migration files.

## 4. Security & Permissions

No API route or permission changes. The worker continues using server-side database, Redis, and S3 credentials only.

## 5. Edge Cases & Failure Modes

| Edge Case                                      | Expected Behavior                                              |
| :--------------------------------------------- | :------------------------------------------------------------- |
| Missing `DATABASE_URL` in worker               | Worker startup fails with a clear database configuration error |
| Missing `REDIS_URL`                            | Worker startup fails with a clear Redis configuration error    |
| Missing API auth variables while worker starts | Worker continues starting                                      |
| Missing API auth variables while API starts    | API continues to fail validation                               |
