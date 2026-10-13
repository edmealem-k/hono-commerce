"use client";

import type React from "react";

export interface PermissionGateSubject {
  id?: string;
  role?: string | null;
  permissions?: readonly string[];
}

export interface PermissionGateProps {
  /**
   * The subject whose permissions are evaluated.
   * Typically passed from `useSession().data.user` or workspace context.
   */
  user?: PermissionGateSubject | null;
  /**
   * Single permission or array of permissions required.
   */
  permission?: string;
  permissions?: string[];
  /**
   * When multiple permissions are specified, require all of them.
   * Default: false (matches if user has any of the permissions).
   */
  requireAll?: boolean;
  /**
   * Optional tenant context ID for tenant-scoped checks.
   */
  tenantId?: string;
  /**
   * Fallback UI to render when permission check fails.
   * Default: null (renders nothing).
   */
  fallback?: React.ReactNode;
  /**
   * Children to render when permission check passes.
   */
  children: React.ReactNode;
}

/**
 * UI permission evaluator. Effective permissions are resolved by the
 * authenticated session; the UI does not duplicate the server role registry.
 */
export function checkUiPermission(
  user: PermissionGateSubject | null | undefined,
  permission: string,
  _tenantId?: string,
): boolean {
  if (!user) return false;

  // Explicit subject permissions override
  if (Array.isArray(user.permissions)) {
    if (
      user.permissions.includes("*") ||
      user.permissions.includes(permission)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Declarative component for conditional rendering based on user permissions.
 *
 * Usage:
 * ```tsx
 * <PermissionGate user={session?.user} permission="orders:refund" fallback={<Badge tone="muted">Restricted</Badge>}>
 *   <Button variant="destructive">Issue Refund</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  user,
  permission,
  permissions,
  requireAll = false,
  tenantId,
  fallback = null,
  children,
}: PermissionGateProps) {
  const targetPermissions = permissions ?? (permission ? [permission] : []);

  if (targetPermissions.length === 0) {
    return <>{children}</>;
  }

  const isAuthorized = requireAll
    ? targetPermissions.every((p) => checkUiPermission(user, p, tenantId))
    : targetPermissions.some((p) => checkUiPermission(user, p, tenantId));

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
