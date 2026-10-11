# Feature Specification: Tenant-Safe S3 File Upload and Preview System

**Feature ID**: `003-s3-file-upload-system`  
**Status**: `Draft`  
**Architecture Reference**: `docs/specs/003-s3-file-upload-system/plan.md`  
**Target Packages**: `packages/types`, `packages/db`, `packages/env`, `packages/ui`, `apps/api`, `apps/dashboard`, `apps/storefront`, `packages/queue`, `apps/worker`

## 1. Overview & Objective

Build a complete direct-to-S3 file lifecycle for tenant files. The system must provide the same major flow used by Nexudy: select and validate a file, optionally prepare/crop it, create a tracked pending upload, issue a short-lived presigned PUT URL, upload directly from the browser with progress and cancellation, confirm the object on the server, attach the resulting file record to a domain entity, produce short-lived signed GET URLs, and render the file through reusable preview surfaces.

This replaces the current partial implementation, which only generates a presigned URL and returns a key. The completed system must prevent silently saving keys for failed uploads, support retry and cleanup, enforce tenant and permission boundaries, and give dashboard/storefront consumers two reusable preview modes:

1. a global stacked bottom drawer for nested review workflows; and
2. a locally controlled bottom sheet for tables, resumes, documents, CSV, and download-oriented flows.

The design is informed by:

- `/home/edmealem.k/zen-notes/inbox/nexudy/nexudy-s3-file-upload-doc.md`
- `/home/edmealem.k/zen-notes/inbox/nexudy/nexudy-file-preview-drawers-architecture.md`
- `/home/edmealem.k/zen-notes/inbox/nexudy/nexudy-file-viewer-sheet-addendum.md`
- the reference implementation in `/home/edmealem.k/Documents/nexudy/Nexudy_Monorepo/packages/ui` and `apps/Nexudy_app/src/lib/s3`

## 2. User Stories & Acceptance Scenarios

### User Story 1: Tenant member uploads a file

> As a **tenant member with the required permission**,  
> I want to upload a file directly to private S3 storage,  
> So that large files do not pass through the API and the resulting file can be safely attached to a commerce record.

#### Acceptance Scenarios

- **Scenario 1.1 (Happy path)**:
  - **Given** an authenticated tenant user with `storage:file:create` and a valid file
  - **When** the client requests an upload session, uploads using the returned PUT URL, and confirms it
  - **Then** the API verifies the S3 object size and content type, marks the file `uploaded_unlinked`, and returns the file ID, S3 key, content hash, and metadata.
- **Scenario 1.2 (Client upload failure)**:
  - **Given** an upload session in `signed` state
  - **When** the browser aborts or receives a network error
  - **Then** the client reports failure, the API marks the attempt and file as failed, and the file is not attachable.
- **Scenario 1.3 (Object mismatch)**:
  - **Given** the client claims a 10 MB PDF
  - **When** S3 contains a different size or normalized content type
  - **Then** confirmation returns `UPLOAD_VALIDATION_FAILED`, the file remains unattachable, and cleanup is scheduled or available.
- **Scenario 1.4 (Duplicate/replay confirmation)**:
  - **Given** an already confirmed upload attempt
  - **When** confirmation is repeated with the same upload attempt ID
  - **Then** the operation is idempotent and returns the previously confirmed result without creating another file.

### User Story 2: Tenant owner attaches a verified file to a domain record

> As a **tenant owner or permitted member**,  
> I want to attach a verified file to a product, tenant logo, KYC record, chat message, or document record,  
> So that the business record references a durable file rather than an unverified URL.

#### Acceptance Scenarios

- **Scenario 2.1 (Attach)**:
  - **Given** a file in `uploaded_unlinked` state owned by the same tenant
  - **When** an authorized user attaches it to a domain record
  - **Then** the API verifies tenant ownership and permission, records the relation, and marks the file `linked`.
- **Scenario 2.2 (Cross-tenant attach)**:
  - **Given** a verified file belonging to tenant A
  - **When** a user attempts to attach it to a tenant B record
  - **Then** the API returns `403 FORBIDDEN` and performs no mutation.
- **Scenario 2.3 (Unverified attach)**:
  - **Given** a file in `pending_upload`, `upload_failed`, or `expired` state
  - **When** the user attempts to attach it
  - **Then** the API returns `409 FILE_NOT_READY`.

### User Story 3: Authorized user previews a private file

> As an **authorized tenant user or platform operator**,  
> I want to preview a private file without exposing a permanent public S3 URL,  
> So that the bucket stays private while the UI remains useful.

#### Acceptance Scenarios

- **Scenario 3.1 (Signed preview)**:
  - **Given** a linked file and a user who can read the owning resource
  - **When** the user requests a preview URL
  - **Then** the API returns a short-lived signed GET URL and file metadata.
- **Scenario 3.2 (Unauthorized preview)**:
  - **Given** a private KYC file owned by tenant A
  - **When** a tenant member without the KYC-read permission requests it
  - **Then** the API returns `403 FORBIDDEN` without signing the URL.
- **Scenario 3.3 (Expired signed URL)**:
  - **Given** a previously resolved signed URL has expired
  - **When** the preview component requests the file again
  - **Then** the client re-resolves the URL and returns to the loading state without losing the selected file.

### User Story 4: User previews and downloads common formats

> As a **dashboard or storefront user**,  
> I want predictable previews for images, PDFs, video, audio, and CSV files plus a download fallback,  
> So that I can inspect files without leaving the workflow.

#### Acceptance Scenarios

- **Scenario 4.1 (Global drawer)**:
  - **Given** a nested file row with a valid signed URL
  - **When** the user selects Preview
  - **Then** a bottom global drawer opens with file name, MIME icon, privacy indicator, renderer, and fullscreen toggle.
- **Scenario 4.2 (Controlled viewer sheet)**:
  - **Given** a table-owned selected file
  - **When** the page sets `isOpen=true` and supplies a `FileViewerFile`
  - **Then** the bottom sheet renders the file and exposes a download action when enabled.
- **Scenario 4.3 (Unsupported type)**:
  - **Given** a ZIP, Office, or unknown binary file
  - **When** the preview opens
  - **Then** the UI shows a clear unsupported state and download CTA.
- **Scenario 4.4 (CSV bounds)**:
  - **Given** a large CSV
  - **When** it is previewed
  - **Then** the client loads only a bounded number of rows/cells and never freezes the page.

### User Story 5: User manages an in-progress upload

> As a **file uploader**,  
> I want progress, cancellation, retry, replacement, and cleanup behavior,  
> So that failed or abandoned uploads do not leave confusing UI or orphaned storage.

#### Acceptance Scenarios

- **Scenario 5.1 (Progress)**: the uploader reports a monotonic percentage from 0 to 100 while the PUT is active.
- **Scenario 5.2 (Cancel)**: cancellation aborts the request, revokes the local object URL, reports `UPLOAD_CANCELED`, and leaves no attachable file.
- **Scenario 5.3 (Replace)**: selecting a replacement first purges or detaches the temporary previous file before exposing the new key.
- **Scenario 5.4 (Retry)**: retry creates a new signed attempt or safely reuses an unexpired attempt; it never overwrites an existing object.

## 3. Invariants & Platform Guardrails (RFC 2119)

### Storage and lifecycle

- **MUST** keep the S3 bucket private; browsers receive only short-lived signed URLs.
- **MUST** use cryptographically random object keys (`randomUUID()` or equivalent), never `Math.random()` for uniqueness or security.
- **MUST** create a database file record before signing an upload and track its status through the lifecycle.
- **MUST** require an upload attempt ID for confirmation and scope it to the authenticated user and tenant.
- **MUST** verify the actual S3 object with `HeadObject` before making a file attachable.
- **MUST** compare expected and actual size and normalized content type; a mismatch MUST fail confirmation.
- **MUST NOT** treat a generated presigned URL as proof that an object exists.
- **MUST NOT** return a raw S3 key as a read URL when storage is misconfigured.
- **MUST** prevent overwriting by signing `If-None-Match: *` or an equivalent write-once condition.
- **SHOULD** calculate and persist a SHA-256 content hash for deduplication, audit, and downstream processing.
- **SHOULD** make confirmation, failure reporting, deletion, and cleanup idempotent.

### Tenant isolation and authorization

- **MUST** derive tenant context from a verified route/session/hostname context; a caller-supplied tenant ID MUST NOT be trusted by itself.
- **MUST** include `tenantId` on every tenant-scoped file and upload-attempt record.
- **MUST** filter every database lookup by both tenant and resource/file identity.
- **MUST** use `hasPermission(authContext, permission)` on the server and `PermissionGate` in frontend surfaces; inline ad-hoc role checks are forbidden.
- **MUST** restrict KYC/legal categories to the configured owner/staff permissions.
- **MUST NOT** authorize a preview solely because a caller guessed a syntactically valid S3 key.
- **MUST** avoid permanent public URLs in database records for private files; persist a file ID or S3 key only.

### API and types

- **MUST** validate all JSON, query, and path input with shared Zod schemas from `@hono-commerce/types`.
- **MUST** use standardized `ok`, `paginated`, and `fail` response envelopes.
- **MUST** expose one-file-per-handler modules and declarative route indexes.
- **MUST** infer frontend response types with `InferResponseType`; manual response DTOs are forbidden.
- **MUST NOT** use `any`, `unknown`, or type assertions as escape hatches.
- **MUST NOT** import BullMQ directly into API/UI code; cleanup and processing jobs use typed queue publishers.

### UI and accessibility

- **MUST** place composite uploaders/viewers under `packages/ui/src/shared/file/*`; atomic primitives remain in `components/*`.
- **MUST** use Base UI composition with `render={...}`, never Radix `asChild`.
- **MUST** implement Initial, Loading, Success, Empty, Error, and Expired states for upload and preview flows.
- **MUST** revoke browser object URLs on replacement, cancellation, unmount, or successful cleanup.
- **MUST** provide keyboard-accessible controls, visible focus states, labels, and mobile touch targets of at least 44px.
- **SHOULD** use a bottom drawer for document/PDF review and a controlled sheet for table-owned preview.

### Environment and migrations

- **MUST** register every S3-related environment variable in `packages/env` and every consuming app’s `.env.example`.
- **MUST NOT** generate, edit, execute, or apply database migrations as part of agent work; humans own migration generation/review/application.

## 4. Security & Permissions

- **Platform roles**: `admin` and `staff` receive only the permissions explicitly granted by the platform permission map.
- **Tenant roles**: `owner` and `member` receive tenant-scoped storage permissions through the permission resolver.
- **Minimum permissions**:
  - `storage:file:create` — request an upload session
  - `storage:file:confirm` — confirm and attach an upload
  - `storage:file:read` — obtain a signed preview URL
  - `storage:file:delete` — delete/detach a file
  - `storage:file:read_sensitive` — preview KYC/legal files
  - `storage:file:manage` — purge orphaned files and manage platform cleanup
- **Tenant isolation**: file and attempt records include `tenantId`; upload and preview operations resolve the tenant from verified context and use composite indexes for tenant/file lookups.
- **S3 policy**: bucket policy denies public reads and writes. Browser PUT is limited by presigned URL expiry, exact signed content type, write-once condition, and server confirmation.
- **Key handling**: only opaque keys/file IDs cross domain boundaries. Original filenames are display metadata and are sanitized for UI, not used as authorization.
- **Download handling**: download links use the same short-lived signed URL and do not create permanent public links.

## 5. Edge Cases & Failure Modes

| Edge Case                          | Expected System Behavior                                          | HTTP Status / Error Code       |
| :--------------------------------- | :---------------------------------------------------------------- | :----------------------------- |
| Missing tenant context             | Reject before signing                                             | `400 TENANT_REQUIRED`          |
| User lacks upload permission       | Do not create attempt                                             | `403 FORBIDDEN`                |
| Invalid category or MIME type      | Return validation issues                                          | `422 VALIDATION_ERROR`         |
| File exceeds category size limit   | Reject session creation                                           | `413 FILE_TOO_LARGE`           |
| S3 signing failure                 | Mark attempt/file failed and return failure envelope              | `500 STORAGE_SIGNING_FAILED`   |
| PUT URL expired                    | Client reports retryable failure; old attempt cannot confirm      | `410 UPLOAD_EXPIRED`           |
| PUT network failure                | Report failure and permit retry/cleanup                           | `502 UPLOAD_FAILED`            |
| Missing object during confirmation | Mark failed; never attach                                         | `409 OBJECT_NOT_FOUND`         |
| Size/content mismatch              | Mark validation failed; purge candidate                           | `422 UPLOAD_VALIDATION_FAILED` |
| Replayed confirmation              | Return existing confirmed result                                  | `200` idempotent success       |
| Cross-tenant file access           | Reject without signing                                            | `403 FORBIDDEN`                |
| File already linked                | Prevent temporary deletion; require detach permission             | `409 FILE_LINKED`              |
| File key not found in DB           | Reject preview even if key shape is valid                         | `404 FILE_NOT_FOUND`           |
| Storage env missing                | Fail closed; never return raw key                                 | `503 STORAGE_UNAVAILABLE`      |
| Signed preview URL expired         | Re-resolve URL in hook/sheet                                      | client `Expired` state         |
| Empty/invalid CSV                  | Show bounded empty/error state with download CTA                  | client error state             |
| Unsupported file type              | Show fallback renderer and download action                        | client unsupported state       |
| Browser cannot render PDF          | Preserve download action                                          | client fallback state          |
| User closes crop modal             | Cancel preparation without starting upload                        | client initial state           |
| User navigates away during PUT     | Abort/release local resources; cleanup job handles pending record | client canceled/expired        |

## 6. Explicit Non-Goals

- Multipart uploads for very large objects in the first release; the design leaves room for a future multipart strategy.
- Public CDN transformation or image optimization pipelines.
- Server-side virus scanning in the first release; the file status model must leave a future `scan_pending` gate available.
- Arbitrary user-defined S3 keys or caller-selected buckets.
- Storing binary file contents in PostgreSQL.

## 7. Definition of Done

The feature is complete when the plan and task checklist are implemented, human-reviewed schema migrations have been applied, the acceptance scenarios pass, frontend components expose all six lifecycle states, no raw S3 URL is persisted for private files, and `bun run verify` completes with zero warnings and zero errors.
