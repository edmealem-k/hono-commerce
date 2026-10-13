import { hasPermission } from "@hono-commerce/auth/permissions";
import { db } from "@hono-commerce/db";
import { createFactory } from "hono/factory";

import { ok } from "../../../lib/response";

import type { AuthEnv } from "../../../types/auth";

const factory = createFactory<AuthEnv>();

export const listWorkspacesHandler = factory.createHandlers(async (c) => {
  const user = c.get("user");

  const memberships = await db.query.tenantMember.findMany({
    columns: { role: true, status: true },
    where: (membership, { eq }) => eq(membership.userId, user.id),
    orderBy: (membership, { desc }) => desc(membership.createdAt),
    with: {
      tenant: {
        columns: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  const workspaces = memberships.map(({ tenant, role, status }) => ({
    ...tenant,
    role,
    memberStatus: status,
  }));

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
