import { hasPermission } from "@hono-commerce/auth/permissions";
import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileAssetLink } from "@hono-commerce/db/schema/files";
import { previewUrlQuerySchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { getReadSignedUrl } from "../../../lib/s3/s3-signed-url";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const getPreviewUrlHandler = factory.createHandlers(
  validated("query", previewUrlQuerySchema),
  async (c) => {
    const { fileId, expiresIn, resourceType, resourceId } =
      c.req.valid("query");
    const user = c.get("user");
    const tenantContext = c.get("tenant");
    const [file] = await db
      .select({
        id: fileAsset.id,
        s3Key: fileAsset.s3Key,
        originalName: fileAsset.originalName,
        contentType: fileAsset.contentType,
        actualSize: fileAsset.actualSize,
        category: fileAsset.category,
        visibility: fileAsset.visibility,
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

    if (file.status !== "uploaded_unlinked" && file.status !== "linked") {
      return c.json(
        fail({
          error: "File is not ready for preview",
          code: "FILE_NOT_READY",
        }),
        409,
      );
    }

    if (file.status === "linked") {
      if (!resourceType || !resourceId) {
        return c.json(
          fail({
            error: "A linked resource context is required for preview",
            code: "FILE_RESOURCE_CONTEXT_REQUIRED",
          }),
          400,
        );
      }

      const [link] = await db
        .select({ id: fileAssetLink.id })
        .from(fileAssetLink)
        .where(
          and(
            eq(fileAssetLink.fileId, file.id),
            eq(fileAssetLink.tenantId, tenantContext.tenantId),
            eq(fileAssetLink.resourceType, resourceType),
            eq(fileAssetLink.resourceId, resourceId),
          ),
        )
        .limit(1);

      if (!link) {
        return c.json(
          fail({
            error: "File is not linked to this resource",
            code: "FILE_LINK_NOT_FOUND",
          }),
          403,
        );
      }
    }

    if (
      (file.category === "kyc" || file.category === "documents") &&
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
          error: "Sensitive file access is forbidden",
          code: "FORBIDDEN",
        }),
        403,
      );
    }

    const url = await getReadSignedUrl(file.s3Key, expiresIn);
    if (!url) {
      return c.json(
        fail({ error: "Storage is unavailable", code: "STORAGE_UNAVAILABLE" }),
        503,
      );
    }

    return c.json(
      ok({
        data: {
          fileId: file.id,
          url,
          s3Key: file.s3Key,
          fileName: file.originalName,
          contentType: file.contentType,
          actualSize: file.actualSize,
          visibility: file.visibility,
        },
      }),
      200,
    );
  },
);
