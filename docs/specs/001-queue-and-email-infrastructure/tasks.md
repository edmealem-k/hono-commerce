# Tasks: Asynchronous Queue & Email Infrastructure

**Feature ID**: `001-queue-and-email-infrastructure`  
**Specification**: `docs/specs/001-queue-and-email-infrastructure/spec.md`  
**Plan**: `docs/specs/001-queue-and-email-infrastructure/plan.md`

---

## Phase 1: Environment & Docker Setup

- [x] 1.1 Add Redis 7 Alpine service to root `docker-compose.yml` with port 6379 and persistent volume
- [x] 1.2 Update and verify `packages/env/src/worker.ts` and `packages/env/src/api.ts` for `REDIS_URL` and `RESEND_API_KEY`
- [x] 1.3 Ensure `.env.example` files in root, `apps/api`, and `apps/worker` document all Redis and Email variables

---

## Phase 2: Core Queue Package (`packages/queue`)

- [x] 2.1 Scaffold `packages/queue/package.json` and `tsconfig.json` with BullMQ and ioredis dependencies
- [x] 2.2 Implement shared Redis connection factory in `packages/queue/src/connection.ts` (`maxRetriesPerRequest: null`)
- [x] 2.3 Define domain-isolated job types and schemas in `packages/queue/src/jobs/email.ts` and re-export via `packages/queue/src/types.ts`
- [x] 2.4 Implement typed `enqueueEmail` publisher in `packages/queue/src/publishers/email.ts`
- [x] 2.5 Export public API in `packages/queue/src/index.ts` and subpath exports in `package.json` (`./jobs/*`)
- [x] 2.6 Validate types compile cleanly (`bun run check-types`)

---

## Phase 3: Notification Templates & Dispatcher (`packages/notification`)

- [x] 3.1 Install React Email components (`@react-email/components`, `@react-email/render`) in `packages/notification`
- [x] 3.2 Build `MagicLinkEmail` template (responsive layout, CTA button, 6-digit fallback code) in `packages/notification/src/templates/magic-link.tsx`
- [x] 3.3 Build `InvitationEmail` template (invitation card, role badge, Accept CTA) in `packages/notification/src/templates/invitation.tsx`
- [x] 3.4 Wire `packages/notification/src/channels/email.ts` to call `enqueueEmail` from `@hono-commerce/queue`
- [x] 3.5 Export templates and dispatchers from `packages/notification/src/index.ts`

---

## Phase 4: Background Worker Application (`apps/worker`)

- [x] 4.1 Scaffold `apps/worker/package.json` and `tsconfig.json` with Turborepo `dev` and `check-types` scripts
- [x] 4.2 Implement template HTML/Text compilation in `apps/worker/src/renderers/email.ts`
- [x] 4.3 Implement transport layer: ANSI terminal box logger for `development` and Resend/SMTP for `production`
- [x] 4.4 Implement BullMQ `Worker` in `apps/worker/src/consumers/email.ts` with exponential backoff and error logging
- [x] 4.5 Implement `apps/worker/src/index.ts` with graceful shutdown handling (`SIGINT`, `SIGTERM`)

---

## Phase 5: Verification & Convergence Gate

- [x] 5.1 Run `bun run check` (`oxlint && oxfmt --write`) (0 warnings, 0 errors)
- [x] 5.2 Run `bun run verify` (`oxlint && oxfmt --check && turbo run check-types`) (0 warnings, 0 errors)
- [x] 5.3 Run automated end-to-end verification (enqueue a test email and verify worker compiles template and logs output)
