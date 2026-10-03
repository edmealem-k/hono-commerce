export type NotificationChannel = "inApp" | "email" | "push" | "sms";

export interface NotificationChannelOptions {
  inApp?: boolean;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

export type NotificationScope = "USER" | "TENANT" | "SYSTEM";

// User-scoped notifications
export type UserNotificationType =
  | "USER_WELCOME"
  | "USER_PASSWORD_RESET"
  | "USER_ORDER_CONFIRMATION"
  | "USER_ORDER_SHIPPED"
  | "USER_ORDER_DELIVERED"
  | "USER_UNREAD_CHAT_MESSAGE"
  | "USER_ABANDONED_CART";

// Tenant-scoped notifications
export type TenantNotificationType =
  | "TENANT_ORDER_CREATED"
  | "TENANT_ORDER_PAID"
  | "TENANT_INVENTORY_LOW"
  | "TENANT_INVENTORY_OUT_OF_STOCK"
  | "TENANT_PAYOUT_SUCCEEDED"
  | "TENANT_PAYOUT_FAILED"
  | "TENANT_KYC_ACTION_REQUIRED"
  | "TENANT_CUSTOMER_SUPPORT_INQUIRY";

// System / Admin-scoped notifications
export type SystemNotificationType =
  | "SYSTEM_ANNOUNCEMENT"
  | "SYSTEM_CRITICAL_ALERT"
  | "SYSTEM_TENANT_REGISTERED";

export type AllNotificationTypes =
  | UserNotificationType
  | TenantNotificationType
  | SystemNotificationType;

export interface NotificationPayloadData {
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
  actionUrl?: string;
}

export interface UserNotificationPayload {
  userId: string;
  email?: string;
  phone?: string;
  data: NotificationPayloadData;
}

export interface TenantNotificationPayload {
  tenantId: string;
  /**
   * Filter recipients by member role (e.g. ["owner"], ["owner", "member"]).
   * TODO(auth-schema): Bind to MerchantRole ("owner" | "member") once auth & tenantMember schema is finalized.
   */
  targetRoles?: string[];
  data: NotificationPayloadData;
}

export interface SystemNotificationPayload {
  /**
   * Filter recipients by platform role (e.g. ["admin"], ["staff"]).
   * TODO(auth-schema): Bind to PlatformRole ("admin" | "staff") once platform RBAC schema is finalized.
   */
  systemRoles?: string[];
  data: NotificationPayloadData;
}
