import type { UserRole as DbUserRole } from "@hono-commerce/db/schema/auth";
import type { TenantMemberRole } from "@hono-commerce/db/schema/tenant";

/**
 * Role Taxonomy & Forward-Compatible Permission Helpers
 *
 * Roles:
 * - Platform (Superadmin): "admin" (unrestricted platform governance), "staff" (support & moderation)
 * - Merchant (Tenant): "owner" (creator, billing, payouts), "member" (store operations, catalog, orders)
 */

export type PlatformRole = Extract<DbUserRole, "admin" | "staff">;
export type MerchantRole = TenantMemberRole;
export type UserRole = DbUserRole | MerchantRole | "guest";

export interface AuthorizationSubject {
  id?: string;
  role?: string | null;
  permissions?: string[];
  [key: string]: string | number | boolean | null | undefined | string[] | Date;
}

export interface PermissionCheckOptions {
  tenantId?: string;
  resourceId?: string;
}

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ["*"], // Wildcard: platform superadmin has full access
  staff: [
    "PLATFORM:READ",
    "PLATFORM:SUPPORT",
    "TENANT:READ",
    "ORDERS:READ",
    "AUDIT:READ",
  ],
  owner: [
    "TENANT:MANAGE",
    "TENANT:BILLING",
    "TENANT:SETTINGS",
    "TEAM:MANAGE",
    "TEAM:INVITE",
    "CATALOG:MANAGE",
    "ORDERS:MANAGE",
    "STORAGE:MANAGE",
    "STORAGE:READ",
    "STORAGE:UPLOAD",
    "ANALYTICS:READ",
  ],
  member: [
    "CATALOG:MANAGE",
    "ORDERS:MANAGE",
    "STORAGE:UPLOAD",
    "STORAGE:READ",
    "ANALYTICS:READ",
  ],
  customer: ["CUSTOMER:PROFILE", "CUSTOMER:ORDERS"],
};

/**
 * Role & permission evaluator.
 * Matches explicit user permissions or role-based permission grants.
 */
export function hasPermission(
  user: AuthorizationSubject | null | undefined,
  permission: string,
  _options?: PermissionCheckOptions,
): boolean {
  if (!user || !user.role) return false;

  // 1. Platform superadmin has universal access
  if (user.role === "admin") {
    return true;
  }

  // 2. Explicit subject permissions override
  if (Array.isArray(user.permissions)) {
    if (
      user.permissions.includes("*") ||
      user.permissions.includes(permission)
    ) {
      return true;
    }
  }

  // 3. Standard role permission grants
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  if (!rolePermissions) return false;

  return rolePermissions.includes("*") || rolePermissions.includes(permission);
}

export function hasAnyPermission(
  user: AuthorizationSubject | null | undefined,
  permissions: string[],
  options?: PermissionCheckOptions,
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.some((perm) => hasPermission(user, perm, options));
}

export function hasAllPermissions(
  user: AuthorizationSubject | null | undefined,
  permissions: string[],
  options?: PermissionCheckOptions,
): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.every((perm) => hasPermission(user, perm, options));
}
