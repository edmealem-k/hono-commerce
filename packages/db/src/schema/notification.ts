import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { tenant } from "./tenant";

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id").references(() => tenant.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    metadata:
      jsonb("metadata").$type<
        Record<string, string | number | boolean | null>
      >(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    idempotencyKey: text("idempotency_key"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("notification_user_unread_idx").on(
      table.userId,
      table.isRead,
      table.createdAt,
    ),
    index("notification_tenant_idx").on(table.tenantId, table.createdAt),
    uniqueIndex("notification_user_idempotency_idx").on(
      table.userId,
      table.idempotencyKey,
    ),
  ],
);

export const notificationPreference = pgTable("notification_preference", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  enabledChannels: jsonb("enabled_channels")
    .$type<string[]>()
    .default(["inApp", "email"])
    .notNull(),
  mutedNotificationTypes: jsonb("muted_notification_types")
    .$type<string[]>()
    .default([])
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  tenant: one(tenant, {
    fields: [notification.tenantId],
    references: [tenant.id],
  }),
}));

export const notificationPreferenceRelations = relations(
  notificationPreference,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreference.userId],
      references: [user.id],
    }),
  }),
);
