export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "api",
  "auth",
  "admin",
  "dashboard",
  "store",
  "static",
  "assets",
  "cdn",
  "mail",
  "status",
]);

export function extractSubdomain(
  host: string | null | undefined,
  rootDomain = "localhost",
): string | null {
  if (!host) return null;

  const hostname = host.split(":")[0]?.toLowerCase().trim() ?? "";
  if (
    !hostname ||
    hostname === rootDomain ||
    hostname === `www.${rootDomain}`
  ) {
    return null;
  }

  // Handle *.localhost or *.domain.com
  if (hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -(rootDomain.length + 1));
    return RESERVED_SUBDOMAINS.has(subdomain) ? null : subdomain;
  }

  // If running on local IP or unrecognized host
  return null;
}

export function extractTenantSlugFromHeaders(headers: Headers): string | null {
  // 1. Explicit tenant header (injected by proxy/middleware)
  const explicitSlug =
    headers.get("x-tenant-slug") || headers.get("x-org-slug");
  if (explicitSlug && !RESERVED_SUBDOMAINS.has(explicitSlug)) {
    return explicitSlug;
  }

  // 2. Extracted path header (e.g. /api/v1/tenants/[tenantSlug]/...)
  const currentPath = headers.get("x-current-path");
  if (currentPath) {
    const segments = currentPath.split("/").filter(Boolean);
    const tenantIdx = segments.findIndex(
      (s) => s === "tenants" || s === "org" || s === "store",
    );
    if (tenantIdx !== -1) {
      const slug = segments[tenantIdx + 1];
      if (slug && !slug.startsWith("[")) return decodeURIComponent(slug);
    }
  }

  // 3. Host header
  const host = headers.get("x-forwarded-host") || headers.get("host");
  return extractSubdomain(host);
}
