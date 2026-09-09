/**
 * Role Taxonomy & Forward-Compatible Permission Helpers
 *
 * Roles:
 * - Platform (Superadmin): "admin" (unrestricted platform governance), "staff" (support & moderation)
 * - Merchant (Tenant): "owner" (creator, billing, payouts), "member" (store operations, catalog, orders)
 */

export type PlatformRole = "admin" | "staff";
export type MerchantRole = "owner" | "member";
export type UserRole = PlatformRole | MerchantRole | "customer" | "guest";

export interface AuthorizationSubject {
  id?: string;
  role?: string | null;
  permissions?: string[];
  [key: string]: unknown;
}

export interface PermissionCheckOptions {
  tenantId?: string;
  resourceId?: string;
}

/**
 * Forward-compatible permission evaluator.
 *
 * Phase 1: Always returns positive access for authenticated users with a valid session/role,
 * establishing the standard function signature across all frontend components and backend routes.
 * Phase 2: Upgrades to granular key comparison (e.g. `WORKSPACE:ORDERS:REFUND`) and member
 * overrides without requiring refactoring across call sites.
 */
export function hasPermission(
  user: AuthorizationSubject | null | undefined,
  _permission: string,
  _options?: PermissionCheckOptions,
): boolean {
  if (!user) return false;

  // Phase 1: Permissive access for any authenticated user
  return true;
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
