# Feature Specification: Relational Queries API Read Refactor

**Feature ID**: `006-rqb-default-read-refactor`  
**Status**: `Implemented`  
**Architecture Reference**: `AGENTS.md` Drizzle Query API Convention  
**Target Packages**: `packages/db`, `apps/api`, `apps/worker`

---

## 1. Overview & Objective

Refactor existing Drizzle database read operations to use Drizzle's Relational Queries API (`db.query`) exclusively, matching the project's preferred Prisma-like query style. Existing insert, update, and delete operations remain Core API operations.

This is a query-layer refactor. It must preserve endpoint and worker behavior, returned data, tenant isolation, authorization checks, transaction behavior, and database query semantics. It does not add features or change the database schema.

## 2. User Stories & Acceptance Scenarios

### User Story 1: Maintain reads in the preferred query style

> As a developer working in Hono Commerce, I want ordinary database reads to use `db.query` by default, so that query code follows the Prisma-like style I prefer.

#### Acceptance Scenarios

- **Scenario 1.1 (Required read style)**:
  - **Given** an existing Core read
  - **When** the query refactor is complete
  - **Then** that read uses `db.query.<table>.findFirst()` or `findMany()` while preserving its required filtering, projection, ordering, pagination, and result semantics.
- **Scenario 1.2 (RQB limitation)**:
  - **Given** the installed RQB version cannot express a multi-table filter in one query
  - **When** that read is refactored
  - **Then** it uses multiple narrowly projected RQB reads and MUST NOT fetch sensitive or tenant-scoped data before applying the relevant filter.
- **Scenario 1.3 (Behavior preservation)**:
  - **Given** an API handler or worker performs a database read
  - **When** its implementation changes from Core to RQB
  - **Then** its response/job behavior, error handling, tenant scoping, and authorization behavior remain unchanged.

## 3. Invariants & Platform Guardrails (RFC 2119)

- **`MUST`**: Use RQB for database row reads, including joins and custom filtering.
- **`MAY`**: Use a narrowly scoped Core aggregate such as `COUNT` when RQB would require fetching every matching row solely to calculate the aggregate.
- **`MUST`**: Preserve explicit tenant filters and all existing authorization boundaries.
- **`MUST`**: Preserve selected fields and externally observable result shapes.
- **`MUST NOT`**: Change schema definitions, create or edit migrations, or change endpoint contracts as part of this refactor.
- **`MUST NOT`**: Use Core `select()` for reads.
- **`MUST NOT`**: Replace Core mutations (`insert`, `update`, `delete`) with a read API.
- **`SHOULD`**: Add or complete relation definitions only when needed for a migrated query, without schema or migration changes.
- **`SHOULD`**: Use RQB projections to retrieve only fields required for the result and compose aggregate or joined shapes in application code when needed.

## 4. Security & Permissions

- **Required Platform Role**: None; internal implementation refactor.
- **Required Tenant Role**: Preserve each handler's existing role and permission requirements.
- **Data Isolation**: Every tenant-scoped read must retain its current tenant filter. Relation traversal does not itself guarantee tenant isolation.

## 5. Edge Cases & Failure Modes

| Edge Case                                                   | Expected System Behavior                                                                                                           |
| :---------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| A query depends on a selected projection                    | Preserve the same fields and nullability observed by its caller.                                                                   |
| A query includes pagination, ordering, or aggregate values  | Preserve existing boundaries, ordering, and counts using RQB projections and application composition where needed.                 |
| A relation required by RQB is not defined                   | Add only the necessary Drizzle relation definition if possible without database schema changes.                                    |
| RQB cannot apply every filter in one query                  | Split the read into narrowly projected RQB queries and apply security or tenant filters before selecting related sensitive fields. |
| The installed Drizzle version lacks a needed RQB capability | Follow the installed version; do not upgrade dependencies as part of this refactor without separate approval.                      |
