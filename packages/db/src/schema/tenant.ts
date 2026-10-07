import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Enums
export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "maintenance",
]);
export type TenantStatus = (typeof tenantStatusEnum.enumValues)[number];

export const tenantMemberRoleEnum = pgEnum("tenant_member_role", [
  "owner",
  "member",
]);
export type TenantMemberRole = (typeof tenantMemberRoleEnum.enumValues)[number];

export const tenantMemberStatusEnum = pgEnum("tenant_member_status", [
  "active",
  "suspended",
]);
export type TenantMemberStatus =
  (typeof tenantMemberStatusEnum.enumValues)[number];

export const tenantInvitationStatusEnum = pgEnum("tenant_invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "canceled",
]);
export type TenantInvitationStatus =
  (typeof tenantInvitationStatusEnum.enumValues)[number];

// 1. Tenant (Store / Organization)
export const tenant = pgTable("tenant", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  status: tenantStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// 2. Tenant Member
export const tenantMember = pgTable(
  "tenant_member",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: tenantMemberRoleEnum("role").default("member").notNull(),
    status: tenantMemberStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tenant_member_user_idx").on(table.tenantId, table.userId),
    index("tenant_member_tenant_idx").on(table.tenantId),
  ],
);

// 3. Tenant Invitation (JWT-Backed, No redundant expiresAt column)
export const tenantInvitation = pgTable(
  "tenant_invitation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: tenantMemberRoleEnum("role").default("member").notNull(),
    status: tenantInvitationStatusEnum("status").default("pending").notNull(),
    inviterId: uuid("inviter_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("tenant_invitation_tenant_idx").on(table.tenantId),
    index("tenant_invitation_email_idx").on(table.email),
    uniqueIndex("tenant_invitation_pending_unique_idx")
      .on(table.tenantId, table.email)
      .where(sql`status = 'pending'`),
    index("tenant_invitation_tenant_email_status_idx").on(
      table.tenantId,
      table.email,
      table.status,
    ),
  ],
);

// Relations
export const tenantRelations = relations(tenant, ({ many }) => ({
  members: many(tenantMember),
  invitations: many(tenantInvitation),
}));

export const tenantMemberRelations = relations(tenantMember, ({ one }) => ({
  tenant: one(tenant, {
    fields: [tenantMember.tenantId],
    references: [tenant.id],
  }),
  user: one(user, {
    fields: [tenantMember.userId],
    references: [user.id],
  }),
}));

export const tenantInvitationRelations = relations(
  tenantInvitation,
  ({ one }) => ({
    tenant: one(tenant, {
      fields: [tenantInvitation.tenantId],
      references: [tenant.id],
    }),
    inviter: one(user, {
      fields: [tenantInvitation.inviterId],
      references: [user.id],
    }),
  }),
);
