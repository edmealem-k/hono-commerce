# Feature Specification: Asynchronous Queue & Email Infrastructure

**Feature ID**: `001-queue-and-email-infrastructure`  
**Status**: `Implemented`  
**Architecture Reference**: `docs/architecture/system-architecture.md#8-unified-event-bus--queuing-architecture-bullmq--redis`  
**Target Packages**: `packages/queue`, `packages/notification`, `apps/worker`, `packages/env`

---

## 1. Overview & Objective

In accordance with Section 4 of `AGENTS.md` and Section 8 of `docs/architecture/system-architecture.md`, the platform mandates an asynchronous message bus (BullMQ + Redis) to decouple critical backend operations from external side effects.

Currently, `packages/queue` is an empty stub (`.gitkeep`), `apps/worker` lacks a runnable entrypoint, and `packages/notification` only prints mock logs to the console. This prevents our authentication system (magic links, verification emails, workspace invitations) and commerce engine (order receipts, shipping notifications, webhooks) from executing reliably without blocking HTTP request threads.

This feature establishes the **core asynchronous event and email infrastructure**:

1. **Queue Manager (`packages/queue`)**: Pluggable Redis connection, BullMQ queue catalog (`emails`, `orders`, `webhooks`), and strictly typed event publishers.
2. **Background Consumer (`apps/worker`)**: Dedicated worker process consuming the `emails` queue with automatic retries, exponential backoff, dead-letter logging, and dual-mode delivery (console link logging in dev, Resend/SMTP in production).
3. **Notification System (`packages/notification`)**: Typed React Email templates (Magic Link, Tenant Invitation, Order Confirmation) and non-blocking dispatchers that push jobs to `@hono-commerce/queue`.
4. **Local Development Redis (`docker-compose.yml`)**: Pre-configured Redis 7 container for instant local development.

---

## 2. User Stories & Acceptance Scenarios

### User Story 1: Non-Blocking Email Publishing

> As an **API service or Auth handler**,  
> I want to **enqueue an email notification in under 15ms**,  
> So that **the HTTP response returns instantly to the client without waiting for third-party email providers**.

#### Acceptance Scenarios

- **Scenario 1.1 (Happy Path - Enqueue Email)**:
  - **Given** Redis is accessible via `REDIS_URL`
  - **When** calling `enqueueEmail({ to: "merchant@store.com", subject: "Sign in", template: "magic-link", props: { url: "http://..." } })`
  - **Then** the job is saved to the BullMQ `emails` queue with a unique `jobId`, returning `{ success: true, jobId }` in $< 15\text{ms}$.
- **Scenario 1.2 (Idempotency Guard)**:
  - **Given** an email job with `idempotencyKey: "magic-link-token-xyz"` is already pending in the queue
  - **When** an identical `enqueueEmail` request with the same idempotency key is submitted within the TTL window
  - **Then** BullMQ skips duplicate insertion, preventing the user from receiving double emails.

### User Story 2: Background Worker Processing & Delivery

> As a **Store Operator or Customer**,  
> I want **my transactional email to be processed in the background and delivered reliably**,  
> So that **transient network or third-party outages do not lose my message**.

#### Acceptance Scenarios

- **Scenario 2.1 (Local Development Console Delivery)**:
  - **Given** `apps/worker` is running with `NODE_ENV=development`
  - **When** a `magic-link` job is picked up by the worker
  - **Then** the worker compiles the React Email template and prints an ANSI-formatted terminal box containing the recipient, subject, and clickable URL to stdout.
- **Scenario 2.2 (Production Delivery via Resend / SMTP)**:
  - **Given** `NODE_ENV=production` and `RESEND_API_KEY` is provided
  - **When** the email job is processed
  - **Then** the worker dispatches the email via the configured transporter and marks the job complete.
- **Scenario 2.3 (Exponential Backoff on Delivery Failure)**:
  - **Given** the email provider returns HTTP 503 or network timeout
  - **When** the job fails
  - **Then** BullMQ retries up to 3 times with exponential backoff (e.g. 2s, 10s, 30s) before moving to the failed state with structured error logs.

---

## 3. Invariants & Platform Guardrails (RFC 2119)

- **`MUST`**: Application routes (`apps/api`, `apps/dashboard`, `apps/storefront`) MUST NEVER import BullMQ directly or instantiate Redis connections for queuing.
- **`MUST`**: All event publishing MUST go through typed functions exported by `@hono-commerce/queue` (`packages/queue/src/publishers/*`).
- **`MUST`**: Inbound webhook handlers (e.g. Stripe) and Auth handlers MUST enqueue jobs to BullMQ and respond with HTTP 200 in $<20\text{ms}$.
- **`MUST NOT`**: Worker consumers MUST NOT process untyped or arbitrary payloads. Every queue must have a strict Zod schema validating the job `data`.
- **`MUST`**: All monetary values formatted inside email templates (e.g. order receipts) MUST be converted from integer cents to localized currency representations using shared formatters.
- **`SHOULD`**: Local development SHOULD output clickable URLs directly in the worker terminal for friction-free developer onboarding without requiring real SMTP credentials.

---

## 4. Security & Permissions

- **Redis Isolation & Authentication**: Redis connection strings MUST support password authentication via `REDIS_URL` (`redis://:password@host:6379`).
- **Secret Hygiene**: Email API keys (`RESEND_API_KEY`, `SMTP_PASS`) must only be exposed to `apps/worker` via `@hono-commerce/env/worker` and NEVER bundled into client applications (`apps/dashboard`, `apps/storefront`).
- **Idempotency Keys**: Jobs originating from payment webhooks or single-use auth tokens must use deterministic IDs (`jobId: "event-" + event.id`) to prevent replay attacks and double processing.

---

## 5. Edge Cases & Failure Modes

| Edge Case                                      | Expected System Behavior                                                                                                          | Recovery / Handling                                                                                                        |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Redis Connection Loss**                      | Queue publishers throw structured error or fallback gracefully; API returns `503 Service Unavailable` with `SERVICE_UNAVAILABLE`. | Exponential auto-reconnect via `ioredis` `retryStrategy`.                                                                  |
| **Third-Party Email API Outage (Resend/SMTP)** | Job fails in worker consumer.                                                                                                     | BullMQ automatically retries 3 times with exponential backoff; if all attempts fail, job moves to Dead Letter Queue (DLQ). |
| **Invalid Email Address Payload**              | Worker rejects payload before calling transport provider.                                                                         | Unrecoverable error; job fails immediately without retry (avoids burning rate limits).                                     |
| **Worker Process Crash Mid-Execution**         | Job is re-claimed by BullMQ lock timeout.                                                                                         | Idempotent worker restarts processing without generating duplicate side effects.                                           |
