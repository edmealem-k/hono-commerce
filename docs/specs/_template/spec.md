# Feature Specification: [Feature Name]

**Feature ID**: `[NNN-feature-name]`  
**Status**: `Draft` <!-- Options: Draft | In Review | Approved | In Progress | Implemented -->  
**Architecture Reference**: `docs/architecture/[relevant-doc].md`  
**Target Packages**: `[e.g. packages/types, apps/api, apps/dashboard]`

---

## 1. Overview & Objective

[Concise 1-3 paragraph summary explaining what this feature does, the business value, and why it is being built.]

---

## 2. User Stories & Acceptance Scenarios

### User Story 1: [Primary Persona Action]

> As a **[Tenant Owner / Store Customer / Platform Admin]**,  
> I want to **[perform action]**,  
> So that **[desired business outcome]**.

#### Acceptance Scenarios (Gherkin / Given-When-Then)

- **Scenario 1.1 (Happy Path)**:
  - **Given** [preconditions, e.g. authenticated as tenant owner on `[slug].localhost:3002`]
  - **When** [trigger action, e.g. submits invitation form with valid email]
  - **Then** [expected result, e.g. creates invitation record and enqueues invitation email job]
- **Scenario 1.2 (Validation / Edge Case)**:
  - **Given** [preconditions, e.g. email is already a member of this tenant]
  - **When** [submitting the form]
  - **Then** [returns HTTP 409 Conflict with standardized error code `ALREADY_EXISTS`]

---

## 3. Invariants & Platform Guardrails (RFC 2119)

- **`MUST`**: [Non-negotiable rule, e.g. MUST filter every query with `eq(table.tenantId, tenantId)`]
- **`MUST NOT`**: [Forbidden pattern, e.g. MUST NOT execute raw SQL without Drizzle schema]
- **`SHOULD`**: [Recommended best practice, e.g. SHOULD use Base UI primitives from `@hono-commerce/ui`]

---

## 4. Security & Permissions

- **Required Platform Role**: `[admin | staff | none]`
- **Required Tenant Role**: `[owner | member | none]`
- **Required Permission**: `[e.g. tenant:members:invite]`
- **Data Isolation**: [How tenant isolation is enforced on read/write]

---

## 5. Edge Cases & Failure Modes

| Edge Case                    | Expected System Behavior                      | HTTP Status / Error Code              |
| :--------------------------- | :-------------------------------------------- | :------------------------------------ |
| [e.g. Expired token]         | [Redirect to invalid token page with message] | `410 GONE` / `TOKEN_EXPIRED`          |
| [e.g. Missing tenant header] | [Reject with bad request]                     | `400 BAD REQUEST` / `TENANT_REQUIRED` |
