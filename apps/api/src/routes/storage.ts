import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { generateTenantS3Key } from "../lib/s3/s3-key";
import {
  getReadSignedUrl,
  getUploadPresignedUrl,
} from "../lib/s3/s3-signed-url";
import { extractTenantSlugFromHeaders } from "../lib/tenant/tenant-context";

const uploadUrlSchema = z.object({
  category: z
    .enum(["products", "kyc", "avatars", "chat", "documents"])
    .default("products"),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  tenantId: z.string().optional(),
});

const previewUrlSchema = z.object({
  s3Key: z.string().min(1),
  expiresIn: z.coerce.number().optional().default(3600),
});

export const storageRouter = new Hono()
  .post("/upload-url", zValidator("json", uploadUrlSchema), async (c) => {
    const { category, fileName, contentType, tenantId } = c.req.valid("json");
    const resolvedTenantId =
      tenantId || extractTenantSlugFromHeaders(c.req.raw.headers) || "default";

    const s3Key = generateTenantS3Key({
      tenantId: resolvedTenantId,
      category,
      fileName,
    });

    const result = await getUploadPresignedUrl({
      s3Key,
      contentType,
    });

    if (!result) {
      return c.json(
        {
          error: "Failed to generate presigned upload URL",
          code: "STORAGE_ERROR",
        },
        500,
      );
    }

    return c.json({ data: result });
  })
  .get("/preview-url", zValidator("query", previewUrlSchema), async (c) => {
    const { s3Key, expiresIn } = c.req.valid("query");
    const signedUrl = await getReadSignedUrl(s3Key, expiresIn);

    if (!signedUrl) {
      return c.json(
        { error: "Failed to generate read signed URL", code: "NOT_FOUND" },
        404,
      );
    }

    return c.json({ data: { url: signedUrl, s3Key } });
  });
