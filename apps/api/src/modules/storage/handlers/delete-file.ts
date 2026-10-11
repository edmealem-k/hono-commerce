import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileAssetLink } from "@hono-commerce/db/schema/files";
import { enqueueStorageCleanup } from "@hono-commerce/queue";
import { deleteFileSchema, fileIdParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const deleteFileHandler = factory.createHandlers(
  validated("param", fileIdParamSchema),
  validated("query", deleteFileSchema),
  async (c) => {
    const { fileId } = c.req.valid("param");
    const { permanent } = c.req.valid("query");
    const tenantContext = c.get("tenant");

    const [file] = await db
      .select({
        id: fileAsset.id,
        s3Key: fileAsset.s3Key,
        status: fileAsset.status,
      })
      .from(fileAsset)
      .where(
        and(
          eq(fileAsset.id, fileId),
          eq(fileAsset.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (!file) {
      return c.json(
        fail({ error: "File not found", code: "FILE_NOT_FOUND" }),
        404,
      );
    }

    if (file.status === "purged" || file.status === "delete_pending") {
      return c.json(ok({ message: "File deletion is already queued" }), 202);
    }

    const links = await db
      .select({ id: fileAssetLink.id })
      .from(fileAssetLink)
      .where(
        and(
          eq(fileAssetLink.fileId, fileId),
          eq(fileAssetLink.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (links.length > 0 && !permanent) {
      return c.json(
        fail({
          error: "File is still attached to a resource",
          code: "FILE_STILL_LINKED",
        }),
        409,
      );
    }

    await db.transaction(async (tx) => {
      if (permanent) {
        await tx
          .delete(fileAssetLink)
          .where(
            and(
              eq(fileAssetLink.fileId, fileId),
              eq(fileAssetLink.tenantId, tenantContext.tenantId),
            ),
          );
      }
      await tx
        .update(fileAsset)
        .set({ status: "delete_pending" })
        .where(
          and(
            eq(fileAsset.id, fileId),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
    });

    await enqueueStorageCleanup({
      jobType: "storage-cleanup",
      tenantId: tenantContext.tenantId,
      fileId,
      s3Key: file.s3Key,
      idempotencyKey: `storage-delete:${tenantContext.tenantId}:${fileId}`,
    });

    return c.json(ok({ message: "File deletion queued" }), 202);
  },
);
