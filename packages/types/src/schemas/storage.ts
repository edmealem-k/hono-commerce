import { z } from "zod";

export const storageCategorySchema = z.enum([
  "products",
  "kyc",
  "avatars",
  "chat",
  "documents",
]);

export const storageVisibilitySchema = z.enum(["private", "public"]);

export const fileUploadStatusSchema = z.enum([
  "pending_upload",
  "signed",
  "uploaded_unlinked",
  "linked",
  "upload_failed",
  "expired",
  "delete_pending",
  "purged",
]);

export const fileUploadAttemptStatusSchema = z.enum([
  "requested",
  "signed",
  "confirmed",
  "client_failed",
  "validation_failed",
  "expired",
]);

export const fileResourceTypeSchema = z.enum([
  "tenant",
  "product",
  "user",
  "kyc",
  "chat",
  "document",
]);

export const mimeTypeSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/,
    "A valid MIME content type is required",
  )
  .transform((value) => value.toLowerCase());

export const createUploadSessionSchema = z.object({
  category: storageCategorySchema.default("products"),
  fileName: z.string().trim().min(1).max(255),
  contentType: mimeTypeSchema,
  fileSize: z.number().int().positive(),
  visibility: storageVisibilitySchema.default("private"),
});

export const confirmUploadSchema = z.object({
  uploadId: z.string().uuid(),
});

export const uploadIdParamSchema = z.object({
  uploadId: z.string().uuid(),
});

export const reportUploadFailureSchema = z.object({
  uploadId: z.string().uuid(),
  reason: z.string().trim().min(1).max(4000),
});

export const previewUrlQuerySchema = z.object({
  fileId: z.string().uuid(),
  expiresIn: z.coerce.number().int().min(60).max(3600).default(900),
});

export const attachFileSchema = z.object({
  fileId: z.string().uuid(),
  resourceType: fileResourceTypeSchema,
  resourceId: z.string().uuid(),
});

export const deleteFileSchema = z.object({
  permanent: z.coerce.boolean().default(false),
});

export type StorageCategory = z.infer<typeof storageCategorySchema>;
export type StorageVisibility = z.infer<typeof storageVisibilitySchema>;
export type FileUploadStatus = z.infer<typeof fileUploadStatusSchema>;
export type FileUploadAttemptStatus = z.infer<
  typeof fileUploadAttemptStatusSchema
>;
export type FileResourceType = z.infer<typeof fileResourceTypeSchema>;
export type CreateUploadSessionInput = z.infer<
  typeof createUploadSessionSchema
>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type UploadIdParam = z.infer<typeof uploadIdParamSchema>;
export type ReportUploadFailureInput = z.infer<
  typeof reportUploadFailureSchema
>;
export type PreviewUrlQuery = z.infer<typeof previewUrlQuerySchema>;
export type AttachFileInput = z.infer<typeof attachFileSchema>;
export type DeleteFileQuery = z.infer<typeof deleteFileSchema>;
