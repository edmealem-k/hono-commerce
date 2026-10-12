import { z } from "zod";

export const workspaceListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(25),
});

const tenantSlugSchema = z
  .string()
  .regex(
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    "A valid store slug is required",
  );

export const workspaceTenantParamSchema = z.object({
  tenantId: z
    .string()
    .refine(
      (value) =>
        z.string().uuid().safeParse(value).success ||
        tenantSlugSchema.safeParse(value).success,
      "A valid store UUID or slug identifier is required",
    ),
});

export type WorkspaceListQuery = z.infer<typeof workspaceListQuerySchema>;
export type WorkspaceTenantParam = z.infer<typeof workspaceTenantParamSchema>;
