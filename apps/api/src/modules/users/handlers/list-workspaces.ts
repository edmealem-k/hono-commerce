import { hasPermission } from "@hono-commerce/auth/permissions";
import { db, desc, eq } from "@hono-commerce/db";
import { tenant, tenantMember } from "@hono-commerce/db/schema/tenant";
import { createFactory } from "hono/factory";

import { ok } from "../../../lib/response";

import type { AuthEnv } from "../../../types/auth";

const factory = createFactory<AuthEnv>();

export const listWorkspacesHandler = factory.createHandlers(async (c) => {
  const user = c.get("user");

  const workspaces = await db
    .select({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo,
      status: tenant.status,
      role: tenantMember.role,
      memberStatus: tenantMember.status,
      createdAt: tenant.createdAt,
    })
    .from(tenantMember)
    .innerJoin(tenant, eq(tenantMember.tenantId, tenant.id))
    .where(eq(tenantMember.userId, user.id))
    .orderBy(desc(tenantMember.createdAt));

  return c.json(
    ok({
      data: {
        workspaces,
        platform: {
          canAccess: hasPermission(user, "PLATFORM:READ"),
        },
      },
    }),
    200,
  );
});
