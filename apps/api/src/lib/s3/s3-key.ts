import { randomUUID } from "node:crypto";

export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
}

export function generateTenantS3Key({
  tenantId,
  category,
  fileName,
}: {
  tenantId: string;
  category: "products" | "kyc" | "avatars" | "chat" | "documents";
  fileName: string;
}): string {
  const timestamp = Date.now();
  const cleanName = sanitizeFileName(fileName) || "file";

  return `tenants/${tenantId}/${category}/${timestamp}-${randomUUID()}-${cleanName}`;
}
