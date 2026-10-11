# Technical Implementation Plan: Tenant-Safe S3 File Upload and Preview System

**Feature ID**: `003-s3-file-upload-system`  
**Specification**: `docs/specs/003-s3-file-upload-system/spec.md`

## 1. Monorepo Package Impact Matrix

| Package / App           | Impact | Scope of Changes                                                                                                                                               |
| :---------------------- | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/types`        |  High  | Shared upload, confirmation, preview, attach, delete, and failure schemas; storage category/permission constants; route catalog entries for UI navigation only |
| `packages/db`           |  High  | `file_asset` and `file_upload_attempt` Drizzle schemas, enums, relations, tenant indexes, domain file references                                               |
| `packages/env`          | Medium | S3 region, bucket, endpoint, credentials/role mode, URL TTLs, size limits, CORS-related configuration                                                          |
| `packages/queue`        | Medium | Typed cleanup, expiration, optional scan/ingestion jobs and publishers; no BullMQ imports outside queue/worker                                                 |
| `packages/notification` |  Low   | Optional user-facing upload failure or processing notifications after transactions commit                                                                      |
| `packages/ui`           |  High  | Composite uploader, image cropper, renderer, global drawer, controlled viewer sheet, MIME helpers, URL resolver hook                                           |
| `apps/api`              |  High  | Storage module handlers, permission checks, S3 lifecycle actions, routes, object confirmation, scoped preview, deletion                                        |
| `apps/worker`           | Medium | Expired-attempt cleanup, orphan purge, optional processing/scan consumer with idempotency                                                                      |
| `apps/dashboard`        | Medium | Tenant/admin upload integrations, file table previews, KYC/document review, permission gates                                                                   |
| `apps/storefront`       | Medium | Product/media upload integration where authorized and customer-facing previews where permitted                                                                 |

## 2. Target Domain Model

### A. `file_asset` (`packages/db/src/schema/files.ts`)

The durable file record is separate from business records. It must include:

- `id` UUID primary key
- `tenantId` UUID foreign key to `tenant.id` with cascade delete
- `s3Key` text unique, opaque, write-once object key
- `originalName` text
- `contentType` text
- `expectedSize` integer
- `actualSize` integer nullable until confirmation
- `contentHash` text nullable
- `category` enum: `products | kyc | avatars | chat | documents`
- `visibility` enum: `private | public` (private is default; public still requires explicit policy)
- `status` enum: `pending_upload | signed | uploaded_unlinked | linked | upload_failed | expired | delete_pending | purged`
- `uploadedByUserId` UUID foreign key to user
- `uploadExpiresAt` timestamp
- `uploadedAt`, `verifiedAt`, `purgedAt` nullable timestamps
- `lastStorageError` text nullable
- `createdAt`, `updatedAt`

Required indexes:

- unique `file_asset_s3_key_uidx` on `s3Key`
- `file_asset_tenant_status_idx` on `(tenantId, status)`
- `file_asset_tenant_category_idx` on `(tenantId, category)`
- `file_asset_tenant_created_idx` on `(tenantId, createdAt)`
- `file_asset_uploader_idx` on `(tenantId, uploadedByUserId)`

### B. `file_upload_attempt`

One file may have multiple attempts; only one confirmed attempt may transition the file to uploaded. Fields:

- `id` UUID primary key
- `tenantId` UUID foreign key
- `fileId` UUID foreign key to `file_asset` with cascade
- `status` enum: `requested | signed | confirmed | client_failed | validation_failed | expired`
- `expiresAt`, `signedAt`, `confirmedAt`, `failedAt`
- `attemptCount` integer
- `errorCode`, `errorMessage`
- `createdAt`, `updatedAt`

Required indexes:

- unique/compound `(tenantId, id)`
- `(tenantId, fileId, status)`
- `(status, expiresAt)` for cleanup

### C. Domain references

New tenant-scoped domain tables must reference `fileAssetId` rather than storing permanent URLs. Existing `tenant.logo`, `user.image`, and future product media fields may temporarily store a key for compatibility, but implementation work must add an explicit migration path to `fileAssetId`. The API must never persist a signed URL.

### D. Future-proof status model

The status enum leaves room for `scan_pending`, `scan_rejected`, and `processing` without making AI/document processing part of the first release. Any future processing job must be idempotent by `fileId` and content hash.

## 3. Contracts & Type Definitions (`@hono-commerce/types`)

Create `packages/types/src/schemas/storage.ts` with shared Zod schemas:

```ts
CreateUploadSessionSchema = z.object({
  category: StorageFolderSchema,
  fileName: z.string().trim().min(1).max(255),
  contentType: MimeTypeSchema,
  fileSize: z.number().int().positive(),
  visibility: z.enum(["private", "public"]).default("private"),
})

ReportUploadFailureSchema = z.object({
  uploadId: z.string().uuid(),
  reason: z.string().trim().min(1).max(4000),
})

PreviewQuerySchema = z.object({
  fileId: z.string().uuid(),
  expiresIn: z.coerce.number().int().min(60).max(3600).default(900),
})

AttachFileSchema = z.object({
  resourceType: z.enum([...]),
  resourceId: z.string().uuid(),
})
```

Confirmation uses the `:uploadId` path parameter and has no duplicate JSON body field. Attach and detach also take `fileId` from the path.

The exact resource type union must be expanded only as supported domain tables are implemented. It must not become an unvalidated string registry.

Export schemas and inferred input types from `packages/types/src/index.ts`. Route catalog entries remain frontend UI paths only; backend paths are inferred from the Hono app type.

Response payloads are not manually duplicated. Consumers use `InferResponseType<typeof api.storage[...], 200>`.

## 4. Environment Configuration

Register and document:

- `AWS_REGION`
- `AWS_S3_BUCKET_NAME`
- `AWS_S3_ENDPOINT` optional for MinIO/LocalStack
- `AWS_ACCESS_KEY_ID` optional when using workload/IAM credentials
- `AWS_SECRET_ACCESS_KEY` optional when using workload/IAM credentials
- `S3_UPLOAD_TTL_SECONDS` default 900
- `S3_READ_TTL_SECONDS` default 900 or 3600 by policy
- `S3_MAX_FILE_SIZE_BYTES`
- category-specific limits where needed
- `S3_FORCE_PATH_STYLE` optional and explicit for local emulators

The env schema must allow either explicit credentials or the AWS default credential chain. Empty values are treated as undefined, but production startup must fail when neither a usable credential mode nor a bucket is configured.

## 5. Backend API Design (`apps/api`)

Implement `apps/api/src/modules/storage/` using one file per handler and a declarative `storage.routes.ts`. Preserve the required mounted storage surface:

|  Method  | Path                                        | Purpose                                                                                         |
| :------: | :------------------------------------------ | :---------------------------------------------------------------------------------------------- |
|  `POST`  | `/api/v1/storage/upload-url`                | Resolve verified tenant context, create `file_asset` + attempt, sign PUT, return upload session |
|  `POST`  | `/api/v1/storage/uploads/:uploadId/confirm` | `HeadObject`, validate metadata/hash, transition to `uploaded_unlinked`                         |
|  `POST`  | `/api/v1/storage/uploads/:uploadId/fail`    | Idempotently report client failure                                                              |
|  `GET`   | `/api/v1/storage/preview-url?fileId=...`    | Verify resource/tenant permission and return signed GET URL + metadata                          |
|  `POST`  | `/api/v1/storage/files/:fileId/attach`      | Attach verified file to an authorized tenant resource                                           |
| `DELETE` | `/api/v1/storage/files/:fileId`             | Detach/purge according to linked-file and retention rules                                       |

Tenant context for `/storage` must come from the verified session/hostname context. The client must not choose an arbitrary tenant UUID in the request body. If a compatibility endpoint retains `tenantId`, it must compare it with resolved context and reject mismatches.

### Handler/action split

- `handlers/create-upload-session.ts`
- `handlers/confirm-upload.ts`
- `handlers/report-upload-failure.ts`
- `handlers/get-preview-url.ts`
- `handlers/attach-file.ts`
- `handlers/delete-file.ts`
- `actions/create-upload-attempt.ts`
- `actions/confirm-uploaded-object.ts`
- `actions/purge-file-object.ts`
- `services/file-access.ts`
- `services/storage-policy.ts`

The S3 service must expose:

- `getS3Client()` singleton
- `createPresignedPutUrl()` with exact `ContentType`, expiry, and write-once condition
- `createPresignedGetUrl()` with no raw-key fallback
- `headS3Object()`
- `deleteS3Object()`
- `calculateObjectSha256()` only when required by policy; avoid loading unbounded objects into memory

### Upload session response

Return `ok({ data: { uploadId, fileId, s3Key, uploadUrl, expiresAt, headers } })`. The browser must send the returned exact headers, especially `Content-Type` and `If-None-Match`.

### Confirmation behavior

Confirmation must:

1. load attempt and file scoped by authenticated tenant/user;
2. reject expired or already failed attempts;
3. call `HeadObject`;
4. normalize and compare content type and exact byte size;
5. optionally calculate checksum;
6. transactionally update attempt and file status;
7. return an idempotent success for an already confirmed attempt.

### Preview authorization

`get-preview-url` must load the file record and verify the user can read the linked resource. It must not infer authorization from S3 key text alone. KYC/legal files require `storage:file:read_sensitive`.

## 6. Queue and Worker Design

Add typed queue contracts/publishers for:

- `storage-cleanup`: expire unconfirmed attempts and purge safe orphan objects
- optional `storage-processing`: post-confirmation scan/metadata extraction

Cleanup jobs must use `fileId`/`uploadId` as idempotency keys. API routes publish through `@hono-commerce/queue` and never import BullMQ directly. The worker must not purge linked files or retained evidence.

## 7. Frontend & Shared UI Architecture

Place composite components in `packages/ui/src/shared/file/`:

```txt
shared/file/
  upload/
    file-uploader.tsx
    image-uploader.tsx
    image-cropper.tsx
    use-file-upload.ts
    upload-policy.ts
  preview/
    file-renderer.tsx
    file-viewer-sheet.tsx
    file-preview-drawer.tsx
    file-preview-button.tsx
    use-file-preview.ts
    mime.ts
  file-record.ts
  use-s3-url.ts
```

### Uploader composition

The generalized `FileUploader` must preserve the useful Nexudy behavior:

- hidden file input plus choose, drag/drop, and paste support where applicable;
- `accept` parsing and client-side validation;
- optional `prepareFile` hook for image crop/compression;
- `AbortController` cancellation;
- progress percentage;
- local `URL.createObjectURL` preview and revocation;
- replacement/delete confirmation;
- callbacks for selected, uploading, success, failure, and removal;
- render-prop surfaces so dashboard/storefront can style the same lifecycle without duplicating upload logic.

`ImageUploader` wraps the generic uploader and adds crop preparation using a modal, preview using a global bottom drawer, aspect ratio, output dimensions, and a custom action renderer.

### Preview composition

`FileRenderer` is the only MIME-to-renderer implementation:

- image: Next image or native image with signed-URL-safe unoptimized behavior;
- PDF: iframe with controlled toolbar policy;
- video: native video;
- audio: native audio;
- CSV/text: bounded parser/table preview;
- unsupported/binary: download-oriented fallback.

`FilePreviewDrawer` wraps `FileRenderer` in the global stacked drawer with file name, MIME icon, privacy badge, and 60–100dvh sizing.

`FileViewerSheet` is a locally controlled bottom sheet with `FileViewerFile`, optional download, empty state, unsupported alert, CSV/audio support, and 95vh layout. `ResumeViewerSheet` remains a compatibility wrapper.

### Six-state matrix

Every uploader and viewer must explicitly cover:

| State   | Uploader                                               | Viewer                                         |
| :------ | :----------------------------------------------------- | :--------------------------------------------- |
| Initial | empty selector/current file                            | no file selected                               |
| Loading | preparing/signing/uploading with progress              | resolving signed URL/loading renderer          |
| Success | verified file preview and key/file ID                  | rendered file                                  |
| Empty   | no selected file                                       | no rows/content/empty CSV                      |
| Error   | validation/signing/PUT/confirmation failure with retry | failed URL/fetch/parser with download fallback |
| Expired | expired attempt or signed URL                          | refresh URL and preserve selection             |

## 8. Dashboard and Storefront Integration

Dashboard integrations:

- tenant logo/avatar upload;
- product media upload;
- KYC/legal document uploader restricted by permission;
- admin review rows with global preview drawer;
- file tables with controlled `FileViewerSheet`.

Storefront integrations:

- merchant-authorized product media only;
- customer preview only for published/publicly permitted records;
- no dashboard-only sensitive file access.

All actions use shared API client shorthand (`api = client.api.v1`) and inferred Hono response types. All permission-sensitive controls use `PermissionGate`.

## 9. Testing and Verification Strategy

- Unit test key generation, filename sanitization, MIME normalization, policy limits, and status transitions.
- API test authorization, tenant mismatch, signing, confirmation mismatch, idempotency, preview access, and deletion.
- S3 adapter test with MinIO/LocalStack or mocked AWS command boundaries; include CORS and exact signed-header behavior in integration checks.
- UI test uploader cancellation, replacement, object URL cleanup, crop cancel, six states, renderer selection, CSV row bounds, download fallback, and viewer expiration.
- End-to-end test: select → sign → PUT → confirm → attach → preview → delete.
- Run `bun run verify`; do not run `bun run build` for routine verification.

## 10. Migration Ownership

AI implementation may author only Drizzle schema TypeScript. A human developer must generate, review, and apply SQL migrations. The task checklist therefore contains a human migration handoff instead of agent-executed migration commands.
