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

export type { Permission } from "@hono-commerce/types";

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

export const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  admin: ["*"], // Wildcard: platform superadmin has full access
  staff: [
    "PLATFORM:READ",
    "PLATFORM:SUPPORT",
    "MODERATION:READ",
    "QUEUES:READ",
    "TENANT:READ",
    "ORDERS:READ",
    "AUDIT:READ",
  ],
  owner: [
    "TENANT:UPDATE",
    "TENANT:MANAGE",
    "TENANT:BILLING",
    "TENANT:SETTINGS",
    "MEMBERS:MANAGE",
    "TEAM:MANAGE",
    "TEAM:INVITE",
    "CATALOG:WRITE",
    "CATALOG:MANAGE",
    "ORDERS:MANAGE",
    "STORAGE:READ",
    "STORAGE:MANAGE",
    "STORAGE:UPLOAD",
    "ANALYTICS:READ",
  ],
  member: [
    "CATALOG:READ",
    "CATALOG:WRITE",
    "CATALOG:MANAGE",
    "ORDERS:READ",
    "ORDERS:MANAGE",
    "STORAGE:READ",
    "STORAGE:UPLOAD",
    "ANALYTICS:READ",
  ],
  customer: ["CUSTOMERS:READ", "ORDERS:READ"],
};

export function getPermissionsForRole(
  role: string | null | undefined,
): string[] {
  return [...(ROLE_PERMISSIONS[role ?? ""] ?? [])];
}

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
  // Explicit subject permissions are resolved at the session boundary.
  if (Array.isArray(user.permissions)) {
    if (
      user.permissions.includes("*") ||
      user.permissions.includes(permission)
    ) {
      return true;
    }
  }

  // Role grants remain available to server-side callers without a session
  // permission projection.
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
