# Secure Tenant File Storage Architecture

**Status:** Canonical architecture guidance  
**Applies to:** `apps/api`, `apps/dashboard`, `apps/storefront`, `packages/db`, `packages/types`, `packages/ui`, `packages/queue`, and `apps/worker`

This document is the permanent source of truth for uploading, confirming, attaching, viewing, and deleting tenant files in S3-compatible storage.

The implementation is based on the Nexudy upload and preview patterns, adapted to Hono, Drizzle, typed RPC, Base UI, and the Hono Commerce tenant model.

## Core rule

The API never proxies file bytes. It authorizes the operation, creates a tracked upload record, signs a short-lived S3 request, and verifies the resulting object. The browser uploads directly to S3 and receives only temporary read URLs.

Private files remain private in the bucket. Database records store an opaque `fileId` and/or `s3Key`, never a permanent signed URL.

## Lifecycle

```text
select file
  → client validation / optional crop
  → POST /api/v1/storage/upload-url
  → create file_asset + file_upload_attempt
  → presigned PUT URL
  → browser PUT directly to S3
  → POST /api/v1/storage/uploads/:uploadId/confirm
  → HeadObject size/type validation
  → uploaded_unlinked
  → attach to a tenant resource
  → linked
  → GET /api/v1/storage/preview-url?fileId=...
  → temporary signed GET URL
  → FileRenderer / FileViewerSheet / FilePreviewDrawer
```

An upload is not considered successful merely because a presigned URL was generated. It becomes usable only after server confirmation.

## Storage boundaries

### Tenant isolation

- Every file and upload attempt is tenant-scoped and contains a non-null `tenantId` foreign key.
- Tenant context is resolved from verified route/session/hostname context.
- A client-supplied tenant identifier is never trusted without comparing it to verified context.
- Every query filters by tenant ID and record ID.
- S3 keys use the format `tenants/{tenantId}/{category}/{timestamp}-{uuid}-{safeName}`.
- `randomUUID()` is required. `Math.random()` is forbidden for object identity.

### S3 access

- S3 buckets must deny public reads and writes.
- PUT URLs are short-lived and sign the exact `Content-Type` and `If-None-Match: *` headers.
- GET URLs are short-lived and generated only after application-level authorization.
- Missing S3 configuration fails closed; the API never returns an S3 key as a fallback URL.
- `controlsList="nodownload"` is only a UI hint. URL expiry and authorization are the real controls.

## Database model

The canonical schema is in `packages/db/src/schema/files.ts`.

### `file_asset`

Stores durable metadata and lifecycle status:

- identity: `id`, `tenantId`, `s3Key`
- display metadata: `originalName`, `contentType`
- validation metadata: `expectedSize`, `actualSize`, `contentHash`
- policy: `category`, `visibility`
- lifecycle: `status`, `uploadExpiresAt`, `uploadedAt`, `verifiedAt`, `purgedAt`
- provenance: `uploadedByUserId`
- failure diagnostics: `lastStorageError`
- auditing: `createdAt`, `updatedAt`

`category` is the storage folder/policy value (Nexudy's folder concept). It is intentionally separate from `resourceType` on `file_asset_link`, which identifies the business resource linked after upload.

Supported asset statuses:

```text
pending_upload → signed → uploaded_unlinked → linked
                         ↘ upload_failed
                         ↘ expired
linked → delete_pending → purged
```

### `file_upload_attempt`

Tracks each signed upload attempt. It contains its own tenant ID, file ID, expiry, status, timestamps, attempt count, and error information. Confirmation and failure reporting must be idempotent.

Supported attempt statuses:

```text
requested → signed → confirmed
                   ↘ client_failed
                   ↘ validation_failed
                   ↘ expired
```

## API contract

Shared request schemas live in `packages/types/src/schemas/storage.ts`. Response payloads are inferred from the Hono route type with `InferResponseType`.

### Create upload session

```http
POST /api/v1/storage/upload-url
```

Input:

```json
{
  "category": "products",
  "fileName": "shoe-image.png",
  "contentType": "image/png",
  "fileSize": 245678,
  "visibility": "private"
}
```

The handler must authenticate, resolve tenant context, check permission, enforce category/size policy, create the file and attempt records, and return a signed PUT URL with its exact required headers.

### Confirm upload

```http
POST /api/v1/storage/uploads/:uploadId/confirm
```

The handler must:

1. load the attempt and file scoped to the authenticated tenant;
2. reject expired, failed, or unauthorized attempts;
3. call S3 `HeadObject`;
4. compare actual byte size and normalized content type with expected metadata;
5. transactionally mark the attempt confirmed and file `uploaded_unlinked`;
6. return the existing result when confirmation is replayed.

### Report client failure

```http
POST /api/v1/storage/uploads/fail
```

The handler records a bounded failure reason, marks the attempt `client_failed`, and marks the file `upload_failed`. Confirmed files cannot be changed back to failed.

### Resolve preview URL

```http
GET /api/v1/storage/preview-url?fileId={uuid}&expiresIn={seconds}
```

The handler loads the file by database ID and tenant, checks that it is `uploaded_unlinked` or `linked`, checks resource/sensitive-file permission, and returns a temporary signed GET URL plus metadata.

Authorization must not be based only on parsing an S3 key string.

### Attach and delete

Future handlers must provide:

- `POST /api/v1/storage/files/:fileId/attach`
- `DELETE /api/v1/storage/files/:fileId`

Only verified files can be attached. Linked files cannot be temporarily purged without an explicit detach/delete permission. Cleanup must respect retention rules.

## Permission policy

Use the existing permission helper and permission-gated UI:

- `STORAGE:UPLOAD` — create sessions, confirm, and report failures
- `STORAGE:READ` — resolve normal previews
- `STORAGE:MANAGE` — sensitive files, attach/detach, purge, and cleanup operations

Do not add inline role checks to new handlers. Platform admin access is resolved by the shared authorization middleware.

## Frontend architecture

Composite components belong in `packages/ui/src/shared/file/*`.

### Upload components

The generic uploader should provide the Nexudy behavior:

- hidden file input
- drag/drop and optional clipboard paste
- MIME and size validation
- `prepareFile` hook for image crop/compression
- progress reporting
- `AbortController` cancellation
- local object URL preview and revocation
- retry, replacement, and delete confirmation
- render-prop surface customization

The image uploader wraps this flow with crop preparation and image preview.

### Preview components

Use one renderer and two shells:

```text
FileRenderer
  ├─ image
  ├─ PDF iframe
  ├─ video
  ├─ audio
  ├─ bounded CSV/text table
  └─ unsupported/download fallback

FilePreviewDrawer  = global stacked bottom drawer
FileViewerSheet    = locally controlled bottom sheet
ResumeViewerSheet  = compatibility wrapper
```

Use the global drawer for nested KYB/admin/gallery workflows. Use the controlled sheet for tables, resumes, application documents, CSV, audio, and download-oriented views.

Every upload and preview surface must implement Initial, Loading, Success, Empty, Error, and Expired states.

## Queue and cleanup

API code must publish typed storage cleanup jobs through `@hono-commerce/queue`. It must not import BullMQ directly.

Cleanup jobs should:

- expire unsigned/unconfirmed attempts;
- purge safe orphan objects;
- never purge linked or retained files;
- use `fileId`/`uploadId` idempotency keys;
- record failure details for operator review.

## Environment rules

All S3 variables must be registered in `packages/env` and documented in `.env.example` files:

- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- optional `AWS_S3_ENDPOINT`
- optional explicit access keys when not using the AWS credential chain
- `AWS_S3_FORCE_PATH_STYLE`
- `S3_UPLOAD_TTL_SECONDS`
- `S3_READ_TTL_SECONDS`
- `S3_MAX_FILE_SIZE_BYTES`

Production must have a usable bucket and credential mode. Local emulators may use an explicit endpoint and path-style addressing.

## Verification checklist

Before merging storage changes:

- no permanent signed URLs persisted;
- tenant and permission checks cover upload, confirm, preview, attach, and delete;
- exact signed headers are used by the browser;
- confirmation calls `HeadObject`;
- failure and expiry states are recoverable;
- object URLs are revoked in the browser;
- S3 bucket CORS permits only required origins and methods;
- `bun run verify` passes with zero warnings and errors;
- human migration review is complete.

## Current implementation state

This section records the repository state as of **2026-10-11**. It prevents future agents from assuming that the entire architecture is already implemented.

### Implemented backend pieces

| Capability                     | Current location                                                 | State                                                        |
| :----------------------------- | :--------------------------------------------------------------- | :----------------------------------------------------------- |
| Shared request schemas         | `packages/types/src/schemas/storage.ts`                          | Implemented                                                  |
| File and upload-attempt tables | `packages/db/src/schema/files.ts`                                | Schema authored; migration requires human review/application |
| S3 client/configuration        | `apps/api/src/lib/s3/s3-client.ts`, `packages/env/src/api.ts`    | Implemented                                                  |
| UUID tenant key generation     | `apps/api/src/lib/s3/s3-key.ts`                                  | Implemented                                                  |
| Presigned PUT/GET helpers      | `apps/api/src/lib/s3/s3-signed-url.ts`                           | Implemented                                                  |
| Upload session                 | `apps/api/src/modules/storage/handlers/create-upload-session.ts` | Implemented                                                  |
| S3 confirmation                | `apps/api/src/modules/storage/handlers/confirm-upload.ts`        | Implemented                                                  |
| Client failure reporting       | `apps/api/src/modules/storage/handlers/report-upload-failure.ts` | Implemented                                                  |
| File-ID preview URL            | `apps/api/src/modules/storage/handlers/get-preview-url.ts`       | Implemented with linked-resource context checks              |

### Remaining application wiring

The Nexudy-equivalent upload system is implemented. Only these two integration steps remain:

| Remaining item           | Current state                                                                                          | Next step                                                                                               |
| :----------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------ |
| First domain integration | `file_asset_link` and attach/detach routes provide the `model/modelId` equivalent                      | Wire one real domain, such as a tenant logo or product image, and pass its resource context to previews |
| AWS bucket configuration | Browser CORS policy is documented in `docs/architecture/storage/s3-cors.md`; application code is ready | Apply the policy to the actual bucket and verify deployed origins                                       |

### Contract alignment

Confirmation now has one canonical contract. The route validates `uploadId` only as a path parameter:

```text
POST /api/v1/storage/uploads/:uploadId/confirm
```

The obsolete body schema was removed so clients cannot send duplicate identifiers. Failure reporting continues to use JSON because it includes the failure reason.

### Component ownership and duplicate-prevention rules

There is one implementation for each responsibility:

- `preview/file-renderer.tsx` is the canonical MIME renderer. It owns image, PDF, video, audio, bounded text/CSV, and unsupported-file fallback behavior.
- `file-preview-drawer.tsx` is the global stacked drawer shell; `preview/file-viewer-sheet.tsx` is the locally controlled sheet shell. They intentionally differ in state ownership, but both delegate rendering to `FileRenderer`.
- `upload/file-uploader.tsx` is the generic upload surface; `upload/image-uploader.tsx` is its image-specific composition with preview and `prepareFile` support.
- `mime-icon.tsx` owns file-type icon selection only, and `use-s3-url.ts` owns signed-URL resolution only.

The current UI set is complete for upload, signed preview, viewing, and opt-in image cropping. Do not add another renderer, drawer, uploader, cropper, or S3 URL hook—extend these canonical modules instead.

This intentionally does not add Nexudy's AI ingestion table or a large resource-specific relation graph. Those belong to a consuming domain only when that domain needs them.
