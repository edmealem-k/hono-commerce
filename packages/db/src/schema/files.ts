import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { tenant } from "./tenant";

export const fileStorageCategoryEnum = pgEnum("file_storage_category", [
  "products",
  "kyc",
  "avatars",
  "chat",
  "documents",
]);

export const fileStorageVisibilityEnum = pgEnum("file_storage_visibility", [
  "private",
  "public",
]);

export const fileAssetStatusEnum = pgEnum("file_asset_status", [
  "pending_upload",
  "signed",
  "uploaded_unlinked",
  "linked",
  "upload_failed",
  "expired",
  "delete_pending",
  "purged",
]);

export const fileUploadAttemptStatusEnum = pgEnum(
  "file_upload_attempt_status",
  [
    "requested",
    "signed",
    "confirmed",
    "client_failed",
    "validation_failed",
    "expired",
  ],
);

export const fileAsset = pgTable(
  "file_asset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    s3Key: text("s3_key").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    expectedSize: integer("expected_size").notNull(),
    actualSize: integer("actual_size"),
    contentHash: text("content_hash"),
    category: fileStorageCategoryEnum("category").notNull(),
    visibility: fileStorageVisibilityEnum("visibility")
      .default("private")
      .notNull(),
    status: fileAssetStatusEnum("status").default("pending_upload").notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    uploadExpiresAt: timestamp("upload_expires_at").notNull(),
    uploadedAt: timestamp("uploaded_at"),
    verifiedAt: timestamp("verified_at"),
    purgedAt: timestamp("purged_at"),
    lastStorageError: text("last_storage_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("file_asset_s3_key_uidx").on(table.s3Key),
    index("file_asset_tenant_status_idx").on(table.tenantId, table.status),
    index("file_asset_tenant_category_idx").on(table.tenantId, table.category),
    index("file_asset_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("file_asset_tenant_uploader_idx").on(
      table.tenantId,
      table.uploadedByUserId,
    ),
  ],
);

export const fileUploadAttempt = pgTable(
  "file_upload_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenant.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => fileAsset.id, { onDelete: "cascade" }),
    status: fileUploadAttemptStatusEnum("status")
      .default("requested")
      .notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    signedAt: timestamp("signed_at"),
    confirmedAt: timestamp("confirmed_at"),
    failedAt: timestamp("failed_at"),
    attemptCount: integer("attempt_count").default(0).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("file_upload_attempt_tenant_file_status_idx").on(
      table.tenantId,
      table.fileId,
      table.status,
    ),
    index("file_upload_attempt_status_expiry_idx").on(
      table.status,
      table.expiresAt,
    ),
    index("file_upload_attempt_tenant_created_idx").on(
      table.tenantId,
      table.createdAt,
    ),
  ],
);

export const fileAssetRelations = relations(fileAsset, ({ one, many }) => ({
  tenant: one(tenant, {
    fields: [fileAsset.tenantId],
    references: [tenant.id],
  }),
  uploadedBy: one(user, {
    fields: [fileAsset.uploadedByUserId],
    references: [user.id],
  }),
  uploadAttempts: many(fileUploadAttempt),
}));

export const fileUploadAttemptRelations = relations(
  fileUploadAttempt,
  ({ one }) => ({
    tenant: one(tenant, {
      fields: [fileUploadAttempt.tenantId],
      references: [tenant.id],
    }),
    file: one(fileAsset, {
      fields: [fileUploadAttempt.fileId],
      references: [fileAsset.id],
    }),
  }),
);
