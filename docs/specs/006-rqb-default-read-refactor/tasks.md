# Tasks: Relational Queries API Read Refactor

**Feature ID**: `006-rqb-default-read-refactor`  
**Specification**: `docs/specs/006-rqb-default-read-refactor/spec.md`  
**Plan**: `docs/specs/006-rqb-default-read-refactor/plan.md`

---

## Phase 1: Relation Metadata

- [x] 1.1 Review current relation metadata; existing relations cover the required nested reads, so no additions were needed.
- [x] 1.2 Confirm relation metadata introduces no SQL schema or migration changes.

## Phase 2: API Read Refactor

- [x] 2.1 Convert tenant lookup and membership reads in `require-tenant.ts`.
- [x] 2.2 Convert invitation lookup reads in tenant and public invitation handlers.
- [x] 2.3 Convert eligible storage metadata/link reads and upload attempt/file reads.
- [x] 2.4 Convert workspace and notification item reads to RQB; retain a database-side aggregate for the unread count to avoid fetching every unread ID.

## Phase 3: Worker and Seed Read Refactor

- [x] 3.1 Convert notification fanout recipient, preference, and platform-user reads.
- [x] 3.2 Convert storage-expiry selection.
- [x] 3.3 Convert seed superadmin lookup.

## Phase 4: Review and Verification

- [x] 4.1 Confirm Core mutations remain Core and no migration/schema SQL changes were made.
- [x] 4.2 Confirm row reads use RQB and aggregate counts remain database-side where materializing matching rows would be wasteful.
- [x] 4.3 Run `bun run verify` successfully.
- [x] 4.4 Mark this spec implemented after all acceptance scenarios are satisfied.
