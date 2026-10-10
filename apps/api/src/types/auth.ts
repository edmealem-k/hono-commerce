import type { auth } from "@hono-commerce/auth";

export type AuthSession = typeof auth.$Infer.Session;
export type SessionUser = AuthSession["user"] & {
  permissions?: string[];
};
export type SessionData = AuthSession["session"];

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  tenantStatus: string;
  role: "owner" | "member";
  memberStatus: "active" | "suspended";
}

export type AuthEnv = {
  Variables: {
    user: SessionUser;
    session: SessionData;
    tenant?: TenantContext;
  };
};

export type TenantEnv = {
  Variables: {
    user: SessionUser;
    session: SessionData;
    tenant: TenantContext;
  };
};
