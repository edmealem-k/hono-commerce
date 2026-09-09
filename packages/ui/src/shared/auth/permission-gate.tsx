"use client";

import type React from "react";

export interface PermissionGateSubject {
  id?: string;
  role?: string | null;
  permissions?: string[];
  [key: string]: unknown;
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
 * Forward-compatible permission evaluator for the UI.
 *
 * Phase 1: Returns true for any authenticated user.
 * Phase 2: Upgrades to granular permission checks against `user.permissions`.
 */
export function checkUiPermission(
  user: PermissionGateSubject | null | undefined,
  _permission: string,
  _tenantId?: string,
): boolean {
  if (!user) return false;
  // Phase 1: Permissive access for authenticated users
  return true;
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
