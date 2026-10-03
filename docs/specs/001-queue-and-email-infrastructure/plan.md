# Technical Implementation Plan: Asynchronous Queue & Email Infrastructure

**Feature ID**: `001-queue-and-email-infrastructure`  
**Specification**: `docs/specs/001-queue-and-email-infrastructure/spec.md`

---

## 1. Monorepo Package Impact Matrix

| Package / App           |   Impact   | Scope of Changes                                                                            |
| :---------------------- | :--------: | :------------------------------------------------------------------------------------------ |
| `packages/queue`        |  **High**  | Scaffold BullMQ manager, Redis connection factory, and typed `enqueueEmail` publisher       |
| `packages/notification` |  **High**  | React Email templates (`MagicLink`, `Invitation`), compile helper, and queue-backed channel |
| `apps/worker`           |  **High**  | Scaffold worker app (`package.json`, `src/index.ts`, email consumer, dev console logger)    |
| `packages/env`          | **Medium** | Validate `REDIS_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `SMTP_*` in worker/api schemas        |
| `docker-compose.yml`    |  **Low**   | Add Redis 7 Alpine service (`port: 6379`) with persistent volume data                       |
| `packages/types`        |  **Low**   | Shared email template enum and job payload definitions                                      |

---

## 2. Contracts & Type Definitions

### A. Email Queue Job Contract (`packages/queue/src/jobs/email.ts`)

```ts
import { z } from "zod";

export const EmailTemplateSchema = z.enum([
  "magic-link",
  "tenant-invitation",
  "order-confirmation",
  "system-alert",
]);
export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// Base envelope schema for shared job fields
export const BaseEmailJobSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  tenantId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});
export type BaseEmailJob = z.infer<typeof BaseEmailJobSchema>;

// Discriminated union for template-specific props
export const EmailPayloadSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("magic-link"),
    props: MagicLinkEmailPropsSchema,
  }),
  z.object({
    template: z.literal("tenant-invitation"),
    props: InvitationEmailPropsSchema,
  }),
  z.object({
    template: z.literal("order-confirmation"),
    props: OrderConfirmationEmailPropsSchema,
  }),
  z.object({
    template: z.literal("system-alert"),
    props: SystemAlertEmailPropsSchema,
  }),
]);

// Composed runtime Zod schema
export const EmailJobSchema = BaseEmailJobSchema.and(EmailPayloadSchema);

// Strongly-typed job data mapping
export type EmailJobData<T extends EmailTemplate = EmailTemplate> =
  EmailJobDataMap[T];
```

### B. Typed Publisher Interface (`packages/queue/src/publishers/email.ts`)

```ts
export interface EnqueueEmailOptions {
  jobId?: string;
  delay?: number;
  priority?: number;
}

export async function enqueueEmail<T extends EmailTemplate = EmailTemplate>(
  payload: EmailJobData<T>,
  options?: EnqueueEmailOptions,
): Promise<{ success: boolean; jobId: string }>;
```

---

## 3. Package Architecture: `@hono-commerce/queue`

Directory layout:

```text
packages/queue/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # Main export: publishers, queue names, types
    ├── connection.ts            # Shared ioredis connection factory (maxRetriesPerRequest: null for BullMQ)
    ├── queues.ts                # Queue name constants and instances
    ├── types.ts                 # Queue-wide constants, options, and domain re-exports
    ├── jobs/
    │   └── email.ts             # Domain-isolated email contracts, prop schemas, and job data
    └── publishers/
        └── email.ts             # enqueueEmail() implementation
```

Key Invariant:

- `ioredis` configuration MUST include `maxRetriesPerRequest: null` as strictly required by BullMQ.

---

## 4. Notification Engine Architecture (`packages/notification`)

Directory layout:

```text
packages/notification/
├── package.json
└── src/
    ├── index.ts
    ├── notify.ts                # notifyUser(), notifyTenant() dispatchers
    ├── channels/
        └── email.ts             # Calls enqueueEmail() from @hono-commerce/queue
    └── templates/
        ├── index.ts             # Template registry and HTML compiler
        ├── magic-link.tsx       # React Email component (CTA button + 6-digit code)
        └── invitation.tsx       # React Email component (Tenant invitation card)
```

---

## 5. Worker Application Architecture (`apps/worker`)

Directory layout:

```text
apps/worker/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # Worker entrypoint: graceful shutdown (SIGINT, SIGTERM)
    ├── consumers/
    │   └── email.ts             # BullMQ Worker instance processing "emails" queue
    ├── renderers/
    │   └── email.ts             # Compiles React Email template into HTML + Text
    └── transports/
        ├── index.ts             # Factory selecting dev logger vs. production transporter
        ├── console.ts           # Development ANSI terminal box printer
        └── resend.ts            # Production Resend / Nodemailer SMTP transporter
```

### Development Delivery Logger:

In `development` mode, the worker compiles the template and prints:

```text
┌─────────────────────────────────────────────────────────────┐
│ ✉️  [WORKER:EMAIL] Local Transactional Email Dispatch        │
├─────────────────────────────────────────────────────────────┤
│ To:      merchant@store.com                                 │
│ Subject: Sign in to Hono Commerce                           │
│ Action:  http://localhost:3002/api/v1/auth/verify?token=... │
└─────────────────────────────────────────────────────────────┘
```

This enables instantaneous, zero-latency local development without needing external SMTP servers or API keys.

---

## 6. Docker & Environment Configuration

### Docker Compose (`docker-compose.yml`):

```yaml
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

### Environment Schema (`packages/env/src/worker.ts`):

- `REDIS_URL`: `z.string().min(1).default("redis://localhost:6379")`
- `NODE_ENV`: `z.enum(["development", "production", "test"]).default("development")`
- `RESEND_API_KEY`: `z.string().optional()`
- `EMAIL_FROM`: `z.string().default("Hono Commerce <noreply@hono-commerce.com>")`

---

## 7. Bull Board Visual Monitoring (`@bull-board/hono` & `apps/dashboard`)

### Architecture

- **API Server (`apps/api`)**: Mounts `@bull-board/hono` at `/admin/queues` using Bun's native `serveStatic` from `hono/bun` and `@bull-board/api/bullMQAdapter`.
- **RBAC Security Guard**: Gated by Better Auth session checking `session.user.role === "admin"`.
- **Admin Portal UI (`apps/dashboard`)**: Embedded at `/admin/queues` inside the admin portal layout, keeping the superadmin in the unified dashboard interface.
