# Tasks: Tenant-Safe S3 File Upload and Preview System

**Feature ID**: `003-s3-file-upload-system`  
**Specification**: `docs/specs/003-s3-file-upload-system/spec.md`  
**Plan**: `docs/specs/003-s3-file-upload-system/plan.md`

## Phase 0: Alignment and Baseline

- [ ] 0.1 Review this spec and plan with the user; record approved category limits, permission names, public/private policy, and first domain integrations.
- [ ] 0.2 Inventory existing fields that contain file keys (`tenant.logo`, `user.image`, future product media) and decide compatibility/foreign-key rollout.
- [ ] 0.3 Capture current storage behavior in regression tests before changing the route contract.

## Phase 1: Contracts and Type Definitions

- [ ] 1.1 Add storage category, visibility, status, and resource-type unions to `packages/types` without `any`, `unknown`, or assertions.
- [ ] 1.2 Add shared Zod schemas for upload session, confirmation, failure report, preview query, attach, and delete.
- [ ] 1.3 Export schemas and inferred input types from `packages/types/src/index.ts`.
- [ ] 1.4 Define typed storage error codes and preserve the standardized response envelope.
- [ ] 1.5 Add/adjust API client shorthand and frontend query/mutation contracts; response types use `InferResponseType`.
- [ ] 1.6 Validate the contracts with `bun run check-types`.

## Phase 2: Database Schema (AI schema work only)

- [ ] 2.1 Add Drizzle enums and `fileAsset` table with tenant foreign key, lifecycle status, metadata, timestamps, and indexes.
- [ ] 2.2 Add `fileUploadAttempt` table with tenant foreign key, file relation, attempt status, expiry, errors, and cleanup indexes.
- [ ] 2.3 Add relations and exports through the database schema barrel.
- [ ] 2.4 Add domain file-reference columns only for the first approved integration; preserve existing fields during compatibility rollout.
- [ ] 2.5 Confirm every tenant-scoped query path has a composite tenant index.
- [ ] 2.6 **Human-only handoff**: a developer generates SQL migrations, reviews them, applies them, and reports the resulting database shape. AI agents must not run `db:generate`, `db:migrate`, `db:push`, or Drizzle migration commands.

## Phase 3: Environment and S3 Adapter

- [ ] 3.1 Update `packages/env/src/api.ts` for bucket, region, optional credential-chain mode, endpoint, path-style mode, TTLs, and size limits.
- [ ] 3.2 Update `apps/api/.env.example` and every consuming app’s example file.
- [ ] 3.3 Replace predictable key suffixes with `randomUUID()` and preserve tenant/category prefixes.
- [ ] 3.4 Implement exact signed PUT headers, write-once behavior, and expiry metadata.
- [ ] 3.5 Implement fail-closed signed GET behavior; never return a raw key as a fallback URL.
- [ ] 3.6 Add `HeadObject`, delete, content-type normalization, and bounded hash support.
- [ ] 3.7 Add adapter tests for AWS and local endpoint configuration, including credential-chain mode.

## Phase 4: Backend Storage Module

- [ ] 4.1 Create `apps/api/src/modules/storage/` with one handler per operation and a declarative routes file.
- [ ] 4.2 Implement verified tenant-context resolution; remove trust in arbitrary body tenant IDs.
- [ ] 4.3 Implement upload-session creation: permission check, category policy, file row, attempt row, signed URL, and failure transaction.
- [ ] 4.4 Implement upload confirmation with `HeadObject`, size/type validation, optional hash, transaction, and idempotency.
- [ ] 4.5 Implement client failure reporting and expired-attempt handling.
- [ ] 4.6 Implement preview URL lookup by file ID with linked-resource authorization and sensitive-file permission checks.
- [ ] 4.7 Implement attach/detach/delete handlers with tenant filtering and linked-file protection.
- [ ] 4.8 Replace direct role comparisons with permission helpers.
- [ ] 4.9 Mount routes under `/api/v1/storage`, export the unified Hono `AppType`, and update typed consumers.
- [ ] 4.10 Add endpoint tests for happy path, validation, tenant mismatch, replay, missing object, mismatch, expiry, and forbidden preview.

## Phase 5: Queue and Worker Cleanup

- [ ] 5.1 Define storage cleanup job contracts under `packages/queue/src/jobs/storage.ts`.
- [ ] 5.2 Add typed publishers for expired attempts, orphan purge, and optional post-confirmation processing.
- [ ] 5.3 Implement worker consumers with idempotency keys and retention/linked-file safeguards.
- [ ] 5.4 Ensure API routes import publishers only, never BullMQ directly.
- [ ] 5.5 Add operational metrics/logging for pending, failed, expired, linked, and purged counts.

## Phase 6: Shared UI Upload Components

- [ ] 6.1 Create `shared/file/upload/use-file-upload.ts` with signing, PUT, progress, cancellation, confirm, failure report, retry, and cleanup.
- [ ] 6.2 Create generic `FileUploader` with hidden input, accept validation, drag/drop, object URLs, replacement, delete confirmation, and render-prop surfaces.
- [ ] 6.3 Create `ImageUploader` and crop preparation flow modeled on Nexudy’s `SimpleImageUploader`.
- [ ] 6.4 Add client policy validation for size/type while keeping server validation authoritative.
- [ ] 6.5 Create `shared/file/preview/mime.ts` with canonical MIME/extension mapping and icon selection.
- [ ] 6.6 Create `FileRenderer` for image, PDF, video, audio, bounded CSV/text, and unsupported fallback.
- [ ] 6.7 Create global `FilePreviewDrawer` with privacy badge, fullscreen resize, and nested workflow support.
- [ ] 6.8 Create controlled `FileViewerSheet` with empty, unsupported, download, audio, CSV, and PDF states.
- [ ] 6.9 Preserve a `ResumeViewerSheet` compatibility wrapper.
- [ ] 6.10 Update `useS3Url` to resolve by API file ID/key, fail closed, refresh expired URLs, and expose loading/error/expired state.
- [ ] 6.11 Use Base UI `render` composition and semantic design tokens from `packages/ui/DESIGN.md`.
- [ ] 6.12 Add UI tests for six states, cancellation, crop cancel, object URL revocation, preview selection, CSV bounds, and download fallback.

## Phase 7: Dashboard and Storefront Integrations

- [ ] 7.1 Integrate tenant logo/avatar upload with attach confirmation and optimistic/pending UI.
- [ ] 7.2 Integrate product media upload with replacement and cleanup behavior.
- [ ] 7.3 Integrate KYC/legal uploads with sensitive permissions and owner/staff gates.
- [ ] 7.4 Add admin review rows using `FilePreviewDrawer`.
- [ ] 7.5 Add table-owned document/resume preview using `FileViewerSheet`.
- [ ] 7.6 Ensure storefront never exposes private dashboard files and only previews published/permitted media.
- [ ] 7.7 Add empty/loading/success/error/expired UI states to each integration.

## Phase 8: End-to-End Verification

- [ ] 8.1 Run API integration flow: create → PUT → confirm → attach → preview → delete.
- [ ] 8.2 Test expired signed URLs and retry/refresh behavior.
- [ ] 8.3 Test local S3 emulator configuration and bucket CORS for browser PUT.
- [ ] 8.4 Confirm no permanent signed URLs are persisted in database fields.
- [ ] 8.5 Run `bun run check` and resolve all formatting/lint issues.
- [ ] 8.6 Run `bun run verify` with 0 warnings and 0 errors.
- [ ] 8.7 Obtain human migration review/application confirmation.
- [ ] 8.8 Mark this feature `Implemented` only after all acceptance scenarios in `spec.md` pass.
