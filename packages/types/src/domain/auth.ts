import {
  userRoleEnum,
  userStatusEnum,
  type UserRole,
  type UserStatus,
} from "@hono-commerce/db/schema/auth";
import {
  tenantInvitationStatusEnum,
  tenantMemberRoleEnum,
  tenantMemberStatusEnum,
  tenantStatusEnum,
  type TenantInvitationStatus,
  type TenantMemberRole,
  type TenantMemberStatus,
  type TenantStatus,
} from "@hono-commerce/db/schema/tenant";

// Runtime enum value tuples directly from Drizzle pgEnum
export const PLATFORM_ROLES = userRoleEnum.enumValues;
export const MERCHANT_ROLES = tenantMemberRoleEnum.enumValues;
export const TENANT_STATUSES = tenantStatusEnum.enumValues;
export const USER_STATUSES = userStatusEnum.enumValues;
export const TENANT_MEMBER_STATUSES = tenantMemberStatusEnum.enumValues;
export const INVITATION_STATUSES = tenantInvitationStatusEnum.enumValues;

// Single source of truth types inferred from Drizzle schemas
export type PlatformRole = UserRole;
export type PlatformAdminRole = Extract<UserRole, "admin" | "staff">;
export type MerchantRole = TenantMemberRole;

export type {
  UserRole,
  UserStatus,
  TenantStatus,
  TenantMemberRole,
  TenantMemberStatus,
  TenantInvitationStatus,
};
