import { hasPermission } from "@hono-commerce/auth/permissions";
import { db } from "@hono-commerce/db";

import { fail } from "../response";

import type { AuthEnv, TenantContext } from "../../types/auth";
import type { Context, Next } from "hono";

export type { TenantContext };

/**
 * Validates tenant existence, active lifecycle status, and caller membership.
 * Resolves structured TenantContext and attaches it to `c.set("tenant", context)`.
 */
export function requireTenantContext(paramKey = "tenantId") {
  return async (c: Context<AuthEnv>, next: Next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        fail({
          error: "Authentication required",
          code: "UNAUTHORIZED",
        }),
        401,
      );
    }

    const identifier =
      c.req.param(paramKey) ||
      c.req.header("x-tenant-slug") ||
      c.req.query("tenantId");

    if (!identifier) {
      return c.json(
        fail({
          error: "Tenant identifier required",
          code: "BAD_REQUEST",
        }),
        400,
      );
    }

    // Is it a UUID or a slug?
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    const tenantRecord = await db.query.tenant.findFirst({
      where: isUuid
        ? (table, { eq }) => eq(table.id, identifier)
        : (table, { eq }) => eq(table.slug, identifier),
    });

    const isPlatformAdmin = hasPermission(user, "PLATFORM:SETTINGS");

    if (!tenantRecord) {
      return c.json(
        fail({
          error: "Store not found",
          code: "TENANT_NOT_FOUND",
        }),
        404,
      );
    }

    if (tenantRecord.status !== "active" && !isPlatformAdmin) {
      return c.json(
        fail({
          error: `Store is currently ${tenantRecord.status}`,
          code: "TENANT_SUSPENDED",
        }),
        403,
      );
    }

    // Platform admin has unrestricted tenant ownership
    if (isPlatformAdmin) {
      const adminContext: TenantContext = {
        tenantId: tenantRecord.id,
        tenantSlug: tenantRecord.slug,
        tenantName: tenantRecord.name,
        tenantStatus: tenantRecord.status,
        role: "owner",
        memberStatus: "active",
      };
      c.set("tenant", adminContext);
      await next();
      return;
    }

    // Verify user membership in tenant
    const membership = await db.query.tenantMember.findFirst({
      where: (table, { and, eq }) =>
        and(eq(table.tenantId, tenantRecord.id), eq(table.userId, user.id)),
    });

    if (!membership) {
      return c.json(
        fail({
          error: "Forbidden: You are not a member of this store",
          code: "FORBIDDEN",
        }),
        403,
      );
    }

    if (membership.status !== "active") {
      return c.json(
        fail({
          error: "Your membership in this store is suspended",
          code: "MEMBERSHIP_SUSPENDED",
        }),
        403,
      );
    }

    const tenantContext: TenantContext = {
      tenantId: tenantRecord.id,
      tenantSlug: tenantRecord.slug,
      tenantName: tenantRecord.name,
      tenantStatus: tenantRecord.status,
      role: membership.role,
      memberStatus: membership.status,
    };

    c.set("tenant", tenantContext);
    await next();
  };
}
