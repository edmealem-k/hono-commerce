# Technical Implementation Plan: Worker Runtime Environment Decoupling

**Feature ID**: `004-worker-runtime-env-decoupling`  
**Specification**: `docs/specs/004-worker-runtime-env-decoupling/spec.md`

## 1. Monorepo Package Impact Matrix

| Package / App           | Impact | Scope                                                     |
| :---------------------- | :----: | :-------------------------------------------------------- |
| `packages/env`          |  High  | Add database-only runtime environment contract            |
| `packages/db`           | Medium | Consume database-only environment contract                |
| `packages/notification` | Medium | Stop forcing API environment validation in worker runtime |
| `apps/worker`           |  Low   | Continue using worker environment contract                |
| `apps/api`              |  Low   | Preserve API environment behavior                         |

## 2. Contracts & Type Definitions

No request schemas, route catalog entries, or response DTOs are needed.

## 3. Database Schema & Migrations

No database schema or migration changes.

## 4. Backend / Runtime Design

- Add `@hono-commerce/env/database` with `DATABASE_URL` validation.
- Update `packages/db` to import that module.
- Make notification URL normalization use an injected/base URL or a shared non-API runtime contract so worker imports do not load `env/api`.
- Keep API authentication configuration in `@hono-commerce/env/api`.

## 5. Verification

- Start worker with API auth variables absent.
- Confirm API still rejects missing auth variables.
- Run `bun run verify`.
