import { tenantMemberRoleEnum } from "@hono-commerce/db/schema/tenant";
import { env } from "@hono-commerce/env/api";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const SECRET_KEY = new TextEncoder().encode(env.BETTER_AUTH_SECRET);
const ISSUER = "hono-commerce";

export const InvitationTokenPayloadSchema = z.object({
  type: z.literal("invitation"),
  invitationId: z.string().min(1),
  tenantId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(tenantMemberRoleEnum.enumValues),
  inviterId: z.string().min(1),
});
export type InvitationTokenPayload = z.infer<
  typeof InvitationTokenPayloadSchema
>;

export const EmailVerificationTokenPayloadSchema = z.object({
  type: z.literal("email-verification"),
  userId: z.string().min(1),
  email: z.string().email(),
});
export type EmailVerificationTokenPayload = z.infer<
  typeof EmailVerificationTokenPayloadSchema
>;

export const StaffDelegationTokenPayloadSchema = z.object({
  type: z.literal("staff-delegation"),
  staffUserId: z.string().min(1),
  targetTenantId: z.string().min(1),
  grantedRole: z.enum(["admin", "staff"]),
});
export type StaffDelegationTokenPayload = z.infer<
  typeof StaffDelegationTokenPayloadSchema
>;

export const OneClickUnsubscribeTokenPayloadSchema = z.object({
  type: z.literal("unsubscribe"),
  userId: z.string().min(1),
  notificationType: z.string().min(1),
});
export type OneClickUnsubscribeTokenPayload = z.infer<
  typeof OneClickUnsubscribeTokenPayloadSchema
>;

export const AuthTokenPayloadSchema = z.discriminatedUnion("type", [
  InvitationTokenPayloadSchema,
  EmailVerificationTokenPayloadSchema,
  StaffDelegationTokenPayloadSchema,
  OneClickUnsubscribeTokenPayloadSchema,
]);
export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

export type VerifyJwtResult<T extends AuthTokenPayload> =
  | { success: true; payload: T }
  | {
      success: false;
      error: "EXPIRED" | "INVALID_SIGNATURE" | "MALFORMED" | "TYPE_MISMATCH";
    };

export async function signJwt<T extends AuthTokenPayload>(
  payload: T,
  options?: { expiresIn?: string | number },
): Promise<string> {
  const expiresIn = options?.expiresIn ?? "7d";

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(expiresIn)
    .sign(SECRET_KEY);
}

export type TokenPayloadMap = {
  invitation: InvitationTokenPayload;
  "email-verification": EmailVerificationTokenPayload;
  "staff-delegation": StaffDelegationTokenPayload;
  unsubscribe: OneClickUnsubscribeTokenPayload;
};

export async function verifyJwt<K extends keyof TokenPayloadMap>(
  token: string,
  expectedType: K,
): Promise<VerifyJwtResult<TokenPayloadMap[K]>>;
export async function verifyJwt<T extends AuthTokenPayload = AuthTokenPayload>(
  token: string,
  expectedType?: T["type"],
): Promise<VerifyJwtResult<T>>;
export async function verifyJwt(
  token: string,
  expectedType?: AuthTokenPayload["type"],
): Promise<VerifyJwtResult<AuthTokenPayload>> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY, {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });

    const parsed = AuthTokenPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: "MALFORMED" };
    }

    if (expectedType && parsed.data.type !== expectedType) {
      return { success: false, error: "TYPE_MISMATCH" };
    }

    return { success: true, payload: parsed.data };
  } catch (err) {
    if (err instanceof Error && err.name === "JWTExpired") {
      return { success: false, error: "EXPIRED" };
    }
    if (err instanceof Error && err.name === "JWSSignatureVerificationFailed") {
      return { success: false, error: "INVALID_SIGNATURE" };
    }
    return { success: false, error: "MALFORMED" };
  }
}

export function decodeJwtUnsafe<K extends keyof TokenPayloadMap>(
  token: string,
  expectedType: K,
): TokenPayloadMap[K] | null;
export function decodeJwtUnsafe<T extends AuthTokenPayload = AuthTokenPayload>(
  token: string,
  expectedType?: T["type"],
): T | null;
export function decodeJwtUnsafe(
  token: string,
  expectedType?: AuthTokenPayload["type"],
): AuthTokenPayload | null {
  try {
    const raw = decodeJwt(token);
    const parsed = AuthTokenPayloadSchema.safeParse(raw);
    if (!parsed.success) return null;
    if (expectedType && parsed.data.type !== expectedType) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
