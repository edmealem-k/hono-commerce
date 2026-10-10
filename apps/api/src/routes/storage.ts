import { and, db, eq } from "@hono-commerce/db";
import { tenantMember } from "@hono-commerce/db/schema/tenant";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { requireAuth } from "../lib/auth/require-auth";
import { generateTenantS3Key } from "../lib/s3/s3-key";
import {
  getReadSignedUrl,
  getUploadPresignedUrl,
} from "../lib/s3/s3-signed-url";

import type { AuthEnv } from "../types/auth";

const MAX_EXPIRES_IN_SECONDS = 3600; // 1 hour maximum

const uploadUrlSchema = z.object({
  tenantId: z.string().uuid("A valid tenant UUID is required"),
  category: z
    .enum(["products", "kyc", "avatars", "chat", "documents"])
    .default("products"),
  fileName: z.string().min(1).max(255),
  contentType: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/,
      "A valid MIME content type is required",
    ),
});

const previewUrlSchema = z.object({
  s3Key: z.string().min(1),
  expiresIn: z.coerce
    .number()
    .min(60)
    .max(MAX_EXPIRES_IN_SECONDS)
    .optional()
    .default(3600),
});

export const storageRouter = new Hono<AuthEnv>()
  .use("*", requireAuth())
  .post("/upload-url", zValidator("json", uploadUrlSchema), async (c) => {
    const user = c.get("user");
    const { category, fileName, contentType, tenantId } = c.req.valid("json");

    // 1. Verify tenant membership and authorization (platform admin bypasses)
    if (user.role !== "admin") {
      const [membership] = await db
        .select()
        .from(tenantMember)
        .where(
          and(
            eq(tenantMember.tenantId, tenantId),
            eq(tenantMember.userId, user.id),
            eq(tenantMember.status, "active"),
          ),
        )
        .limit(1);

      if (!membership) {
        return c.json(
          {
            error: "Forbidden: You are not an active member of this store",
            code: "FORBIDDEN",
          },
          403,
        );
      }

      // Restrict sensitive KYC and legal documents to store owners
      if (
        (category === "kyc" || category === "documents") &&
        membership.role !== "owner"
      ) {
        return c.json(
          {
            error:
              "Forbidden: Only store owners may upload KYC or legal documents",
            code: "FORBIDDEN",
          },
          403,
        );
      }
    }

    const s3Key = generateTenantS3Key({
      tenantId,
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
    const user = c.get("user");
    const { s3Key, expiresIn } = c.req.valid("query");

    // Enforce structured tenant S3 key format: tenants/{tenantId}/{category}/...
    const match =
      /^tenants\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/([^/]+)\//.exec(
        s3Key,
      );
    const targetTenantId = match?.[1];
    const category = match?.[2];

    if (!targetTenantId) {
      // Non-tenant files (e.g. platform assets) require platform admin
      if (user.role !== "admin") {
        return c.json(
          {
            error: "Forbidden: Invalid file path or unauthorized tenant scope",
            code: "FORBIDDEN",
          },
          403,
        );
      }
    } else {
      // If not platform admin, verify active store membership
      if (user.role !== "admin") {
        const [membership] = await db
          .select()
          .from(tenantMember)
          .where(
            and(
              eq(tenantMember.tenantId, targetTenantId),
              eq(tenantMember.userId, user.id),
              eq(tenantMember.status, "active"),
            ),
          )
          .limit(1);

        if (!membership) {
          return c.json(
            {
              error: "Forbidden: You do not have access to this store's files",
              code: "FORBIDDEN",
            },
            403,
          );
        }

        // Restrict sensitive KYC and legal documents to store owners
        if (
          (category === "kyc" || category === "documents") &&
          membership.role !== "owner"
        ) {
          return c.json(
            {
              error:
                "Forbidden: Only store owners may view KYC or legal documents",
              code: "FORBIDDEN",
            },
            403,
          );
        }
      }
    }

    const safeExpiresIn = Math.min(expiresIn ?? 3600, MAX_EXPIRES_IN_SECONDS);
    const signedUrl = await getReadSignedUrl(s3Key, safeExpiresIn);

    if (!signedUrl) {
      return c.json(
        { error: "Failed to generate read signed URL", code: "NOT_FOUND" },
        404,
      );
    }

    return c.json({ data: { url: signedUrl, s3Key } });
  });
