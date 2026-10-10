import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileUploadAttempt } from "@hono-commerce/db/schema/files";
import { reportUploadFailureSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const reportUploadFailureHandler = factory.createHandlers(
  validated("json", reportUploadFailureSchema),
  async (c) => {
    const { uploadId, reason } = c.req.valid("json");
    const tenantContext = c.get("tenant");

    const [attempt] = await db
      .select({
        fileId: fileUploadAttempt.fileId,
        status: fileUploadAttempt.status,
      })
      .from(fileUploadAttempt)
      .where(
        and(
          eq(fileUploadAttempt.id, uploadId),
          eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (!attempt) {
      return c.json(
        fail({ error: "Upload attempt not found", code: "UPLOAD_NOT_FOUND" }),
        404,
      );
    }

    if (attempt.status === "confirmed") {
      return c.json(
        fail({
          error: "A confirmed upload cannot be marked as failed",
          code: "UPLOAD_ALREADY_CONFIRMED",
        }),
        409,
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .update(fileUploadAttempt)
        .set({
          status: "client_failed",
          failedAt: new Date(),
          errorCode: "CLIENT_UPLOAD_FAILED",
          errorMessage: reason,
        })
        .where(
          and(
            eq(fileUploadAttempt.id, uploadId),
            eq(fileUploadAttempt.tenantId, tenantContext.tenantId),
          ),
        );
      await tx
        .update(fileAsset)
        .set({ status: "upload_failed", lastStorageError: reason })
        .where(
          and(
            eq(fileAsset.id, attempt.fileId),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
    });

    return c.json(ok({ message: "Upload failure recorded" }), 200);
  },
);
