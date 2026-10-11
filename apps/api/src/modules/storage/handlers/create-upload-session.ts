import { hasPermission } from "@hono-commerce/auth/permissions";
import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileUploadAttempt } from "@hono-commerce/db/schema/files";
import { env } from "@hono-commerce/env/api";
import { createUploadSessionSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { generateTenantS3Key } from "../../../lib/s3/s3-key";
import { getUploadPresignedUrl } from "../../../lib/s3/s3-signed-url";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const createUploadSessionHandler = factory.createHandlers(
  validated("json", createUploadSessionSchema),
  async (c) => {
    const input = c.req.valid("json");
    const user = c.get("user");
    const tenantContext = c.get("tenant");

    if (input.fileSize > env.S3_MAX_FILE_SIZE_BYTES) {
      return c.json(
        fail({
          error: `File exceeds the ${env.S3_MAX_FILE_SIZE_BYTES}-byte limit`,
          code: "FILE_TOO_LARGE",
        }),
        413,
      );
    }

    if (
      (input.category === "kyc" || input.category === "documents") &&
      !hasPermission(
        {
          id: user.id,
          role: tenantContext.role,
          permissions: user.permissions,
        },
        "STORAGE:MANAGE",
      )
    ) {
      return c.json(
        fail({
          error: "Only authorized tenant owners may upload sensitive files",
          code: "FORBIDDEN",
        }),
        403,
      );
    }

    const s3Key = generateTenantS3Key({
      tenantId: tenantContext.tenantId,
      category: input.category,
      fileName: input.fileName,
    });
    const expiresAt = new Date(Date.now() + env.S3_UPLOAD_TTL_SECONDS * 1000);

    const created = await db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(fileAsset)
        .values({
          tenantId: tenantContext.tenantId,
          s3Key,
          originalName: input.fileName,
          contentType: input.contentType,
          expectedSize: input.fileSize,
          category: input.category,
          visibility: input.visibility,
          status: "pending_upload",
          uploadedByUserId: user.id,
          uploadExpiresAt: expiresAt,
        })
        .returning({ id: fileAsset.id, s3Key: fileAsset.s3Key });

      if (!asset) return null;

      const [attempt] = await tx
        .insert(fileUploadAttempt)
        .values({
          tenantId: tenantContext.tenantId,
          fileId: asset.id,
          status: "requested",
          expiresAt,
          attemptCount: 1,
        })
        .returning({ id: fileUploadAttempt.id });

      if (!attempt) return null;

      return { ...asset, attemptId: attempt.id };
    });

    if (!created) {
      return c.json(
        fail({
          error: "Failed to create upload session",
          code: "CREATION_FAILED",
        }),
        500,
      );
    }

    const signed = await getUploadPresignedUrl({
      s3Key: created.s3Key,
      contentType: input.contentType,
      expiresIn: env.S3_UPLOAD_TTL_SECONDS,
    });

    if (!signed) {
      await db
        .update(fileAsset)
        .set({ status: "upload_failed", lastStorageError: "SIGNING_FAILED" })
        .where(
          and(
            eq(fileAsset.id, created.id),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
      await db
        .update(fileUploadAttempt)
        .set({
          status: "validation_failed",
          failedAt: new Date(),
          errorCode: "SIGNING_FAILED",
          errorMessage: "Failed to generate presigned upload URL",
        })
        .where(
          and(
            eq(fileUploadAttempt.id, created.attemptId),
            eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
          ),
        );

      return c.json(
        fail({
          error: "Failed to generate presigned upload URL",
          code: "STORAGE_SIGNING_FAILED",
        }),
        500,
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(fileAsset)
        .set({ status: "signed" })
        .where(
          and(
            eq(fileAsset.id, created.id),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
      await tx
        .update(fileUploadAttempt)
        .set({ status: "signed", signedAt: new Date() })
        .where(
          and(
            eq(fileUploadAttempt.id, created.attemptId),
            eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
          ),
        );
    });

    return c.json(
      ok({
        data: {
          uploadId: created.attemptId,
          fileId: created.id,
          s3Key: created.s3Key,
          uploadUrl: signed.uploadUrl,
          expiresAt: expiresAt.toISOString(),
          headers: {
            "Content-Type": input.contentType,
            "If-None-Match": "*",
          },
        },
      }),
      201,
    );
  },
);
