import { and, db, eq } from "@hono-commerce/db";
import { fileAsset, fileAssetLink } from "@hono-commerce/db/schema/files";
import { attachFileSchema, fileIdParamSchema } from "@hono-commerce/types";
import { createFactory } from "hono/factory";

import { fail, ok } from "../../../lib/response";
import { validated } from "../../../lib/validation";

import type { TenantEnv } from "../../../types/auth";

const factory = createFactory<TenantEnv>();

export const attachFileHandler = factory.createHandlers(
  validated("param", fileIdParamSchema),
  validated("json", attachFileSchema),
  async (c) => {
    const { fileId } = c.req.valid("param");
    const { resourceType, resourceId } = c.req.valid("json");
    const tenantContext = c.get("tenant");
    const user = c.get("user");

    if (resourceType === "tenant" && resourceId !== tenantContext.tenantId) {
      return c.json(
        fail({ error: "Resource is outside this tenant", code: "FORBIDDEN" }),
        403,
      );
    }

    const file = await db.query.fileAsset.findFirst({
      columns: { id: true, status: true },
      where: (table, { and, eq }) =>
        and(eq(table.id, fileId), eq(table.tenantId, tenantContext.tenantId)),
    });

    if (!file) {
      return c.json(
        fail({ error: "File not found", code: "FILE_NOT_FOUND" }),
        404,
      );
    }

    if (file.status !== "uploaded_unlinked" && file.status !== "linked") {
      return c.json(
        fail({ error: "File is not ready to attach", code: "FILE_NOT_READY" }),
        409,
      );
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(fileAssetLink)
        .values({
          tenantId: tenantContext.tenantId,
          fileId,
          resourceType,
          resourceId,
          linkedByUserId: user.id,
        })
        .onConflictDoNothing();
      await tx
        .update(fileAsset)
        .set({ status: "linked" })
        .where(
          and(
            eq(fileAsset.id, fileId),
            eq(fileAsset.tenantId, tenantContext.tenantId),
          ),
        );
    });

    return c.json(
      ok({
        data: { fileId, resourceType, resourceId, status: "linked" as const },
        message: "File attached",
      }),
      200,
    );
  },
);
