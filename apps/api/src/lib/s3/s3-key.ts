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
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const cleanName = sanitizeFileName(fileName);

  return `tenants/${tenantId}/${category}/${timestamp}-${randomSuffix}-${cleanName}`;
}
