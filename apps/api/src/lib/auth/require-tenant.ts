import { and, db, eq } from "@hono-commerce/db";
import { tenant, tenantMember } from "@hono-commerce/db/schema/tenant";

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

    const [tenantRecord] = await db
      .select()
      .from(tenant)
      .where(isUuid ? eq(tenant.id, identifier) : eq(tenant.slug, identifier))
      .limit(1);

    if (!tenantRecord) {
      return c.json(
        fail({
          error: "Store not found",
          code: "TENANT_NOT_FOUND",
        }),
        404,
      );
    }

    if (tenantRecord.status !== "active" && user.role !== "admin") {
      return c.json(
        fail({
          error: `Store is currently ${tenantRecord.status}`,
          code: "TENANT_SUSPENDED",
        }),
        403,
      );
    }

    // Platform admin has unrestricted tenant ownership
    if (user.role === "admin") {
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
    const [membership] = await db
      .select()
      .from(tenantMember)
      .where(
        and(
          eq(tenantMember.tenantId, tenantRecord.id),
          eq(tenantMember.userId, user.id),
        ),
      )
      .limit(1);

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
