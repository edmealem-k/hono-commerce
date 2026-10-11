import { Hono } from "hono";

import { requireAuth } from "../../lib/auth/require-auth";
import { requirePermission } from "../../lib/auth/require-permission";
import { requireTenantContext } from "../../lib/auth/require-tenant";
import { attachFileHandler } from "./handlers/attach-file";
import { confirmUploadHandler } from "./handlers/confirm-upload";
import { createUploadSessionHandler } from "./handlers/create-upload-session";
import { deleteFileHandler } from "./handlers/delete-file";
import { detachFileHandler } from "./handlers/detach-file";
import { getPreviewUrlHandler } from "./handlers/get-preview-url";
import { reportUploadFailureHandler } from "./handlers/report-upload-failure";

import type { TenantEnv } from "../../types/auth";

export const storageRouter = new Hono<TenantEnv>()
  .use("*", requireAuth())
  .use("*", requireTenantContext())
  .post(
    "/upload-url",
    requirePermission("STORAGE:UPLOAD"),
    ...createUploadSessionHandler,
  )
  .post(
    "/uploads/:uploadId/confirm",
    requirePermission("STORAGE:UPLOAD"),
    ...confirmUploadHandler,
  )
  .post(
    "/uploads/fail",
    requirePermission("STORAGE:UPLOAD"),
    ...reportUploadFailureHandler,
  )
  .get(
    "/preview-url",
    requirePermission("STORAGE:READ"),
    ...getPreviewUrlHandler,
  )
  .post(
    "/files/:fileId/links",
    requirePermission("STORAGE:MANAGE"),
    ...attachFileHandler,
  )
  .delete(
    "/files/:fileId/links",
    requirePermission("STORAGE:MANAGE"),
    ...detachFileHandler,
  )
  .delete(
    "/files/:fileId",
    requirePermission("STORAGE:MANAGE"),
    ...deleteFileHandler,
  );
