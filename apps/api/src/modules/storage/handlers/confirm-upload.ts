import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileUploadAttempt } from "@hono-commerce/db/schema/files";
import { uploadIdParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { headS3Object } from "../../../lib/s3/s3-signed-url";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const confirmUploadHandler = factory.createHandlers(
  validated("param", uploadIdParamSchema),
  async (c) => {
    const { uploadId } = c.req.valid("param");
    const tenantContext = c.get("tenant");
    const [record] = await db
      .select({
        attemptId: fileUploadAttempt.id,
        attemptStatus: fileUploadAttempt.status,
        attemptExpiresAt: fileUploadAttempt.expiresAt,
        fileId: fileAsset.id,
        s3Key: fileAsset.s3Key,
        expectedSize: fileAsset.expectedSize,
        expectedContentType: fileAsset.contentType,
        fileStatus: fileAsset.status,
      })
      .from(fileUploadAttempt)
      .innerJoin(fileAsset, eq(fileUploadAttempt.fileId, fileAsset.id))
      .where(
        and(
          eq(fileUploadAttempt.id, uploadId),
          eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
          eq(fileAsset.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (!record) {
      return c.json(
        fail({
          error: "Upload attempt not found",
          code: "UPLOAD_NOT_FOUND",
        }),
        404,
      );
    }

    if (record.attemptStatus === "confirmed") {
      return c.json(
        ok({
          data: {
            uploadId: record.attemptId,
            fileId: record.fileId,
            s3Key: record.s3Key,
            status: record.fileStatus,
          },
          message: "Upload was already confirmed",
        }),
        200,
      );
    }

    if (record.attemptExpiresAt <= new Date()) {
      await markUploadFailed(
        record.attemptId,
        record.fileId,
        tenantContext.tenantId,
        "expired",
        "UPLOAD_EXPIRED",
        "Upload confirmation window expired",
      );
      return c.json(
        fail({
          error: "Upload confirmation window expired",
          code: "UPLOAD_EXPIRED",
        }),
        410,
      );
    }

    if (record.attemptStatus !== "signed") {
      return c.json(
        fail({
          error: `Upload attempt is ${record.attemptStatus}`,
          code: "UPLOAD_NOT_READY",
        }),
        409,
      );
    }

    let metadata: Awaited<ReturnType<typeof headS3Object>>;
    try {
      metadata = await headS3Object(record.s3Key);
    } catch (error) {
      console.error("[confirmUpload] Failed to inspect S3 object:", error);
      await markUploadFailed(
        record.attemptId,
        record.fileId,
        tenantContext.tenantId,
        "validation_failed",
        "OBJECT_NOT_FOUND",
        "Uploaded object could not be found",
      );
      return c.json(
        fail({
          error: "Uploaded object could not be found",
          code: "OBJECT_NOT_FOUND",
        }),
        409,
      );
    }

    const expectedContentType = record.expectedContentType
      .split(";")[0]
      ?.trim()
      .toLowerCase();
    if (
      metadata.contentLength !== record.expectedSize ||
      metadata.contentType !== expectedContentType
    ) {
      await markUploadFailed(
        record.attemptId,
        record.fileId,
        tenantContext.tenantId,
        "validation_failed",
        "OBJECT_METADATA_MISMATCH",
        "Uploaded object metadata does not match the requested file",
      );
      return c.json(
        fail({
          error: "Uploaded object failed metadata validation",
          code: "UPLOAD_VALIDATION_FAILED",
        }),
        422,
      );
    }

    const uploadedAt = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(fileAsset)
        .set({
          actualSize: metadata.contentLength,
          status: "uploaded_unlinked",
          uploadedAt,
          verifiedAt: uploadedAt,
          lastStorageError: null,
        })
        .where(
          and(
            eq(fileAsset.id, record.fileId),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
      await tx
        .update(fileUploadAttempt)
        .set({ status: "confirmed", confirmedAt: uploadedAt })
        .where(
          and(
            eq(fileUploadAttempt.id, record.attemptId),
            eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
          ),
        );
    });

    return c.json(
      ok({
        data: {
          uploadId: record.attemptId,
          fileId: record.fileId,
          s3Key: record.s3Key,
          status: "uploaded_unlinked" as const,
          actualSize: metadata.contentLength,
          contentType: metadata.contentType,
        },
      }),
      200,
    );
  },
);

async function markUploadFailed(
  attemptId: string,
  fileId: string,
  tenantId: string,
  attemptStatus: "expired" | "validation_failed",
  errorCode: string,
  errorMessage: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(fileAsset)
      .set({
        status: attemptStatus === "expired" ? "expired" : "upload_failed",
        lastStorageError: errorCode,
      })
      .where(and(eq(fileAsset.id, fileId), eq(fileAsset.tenantId, tenantId)));
    await tx
      .update(fileUploadAttempt)
      .set({
        status: attemptStatus,
        failedAt: new Date(),
        errorCode,
        errorMessage,
      })
      .where(
        and(
          eq(fileUploadAttempt.id, attemptId),
          eq(fileUploadAttempt.tenantId, tenantId),
        ),
      );
  });
}
