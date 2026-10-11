import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileAssetLink } from "@hono-commerce/db/schema/files";
import { attachFileSchema, fileIdParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const detachFileHandler = factory.createHandlers(
  validated("param", fileIdParamSchema),
  validated("json", attachFileSchema),
  async (c) => {
    const { fileId } = c.req.valid("param");
    const { resourceType, resourceId } = c.req.valid("json");
    const tenantContext = c.get("tenant");

    if (resourceType === "tenant" && resourceId !== tenantContext.tenantId) {
      return c.json(
        fail({ error: "Resource is outside this tenant", code: "FORBIDDEN" }),
        403,
      );
    }

    const deleted = await db
      .delete(fileAssetLink)
      .where(
        and(
          eq(fileAssetLink.fileId, fileId),
          eq(fileAssetLink.tenantId, tenantContext.tenantId),
          eq(fileAssetLink.resourceType, resourceType),
          eq(fileAssetLink.resourceId, resourceId),
        ),
      )
      .returning({ id: fileAssetLink.id });

    if (deleted.length === 0) {
      return c.json(
        fail({ error: "File link not found", code: "FILE_LINK_NOT_FOUND" }),
        404,
      );
    }

    const remainingLinks = await db
      .select({ id: fileAssetLink.id })
      .from(fileAssetLink)
      .where(
        and(
          eq(fileAssetLink.fileId, fileId),
          eq(fileAssetLink.tenantId, tenantContext.tenantId),
        ),
      )
      .limit(1);

    if (remainingLinks.length === 0) {
      await db
        .update(fileAsset)
        .set({ status: "uploaded_unlinked" })
        .where(
          and(
            eq(fileAsset.id, fileId),
            eq(fileAsset.tenantId, tenantContext.tenantId),
            eq(fileAsset.status, "linked"),
          ),
        );
    }

    return c.json(ok({ message: "File detached" }), 200);
  },
);
