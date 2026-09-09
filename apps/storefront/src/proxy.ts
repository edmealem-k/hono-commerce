import { NextResponse, type NextRequest } from "next/server";

const TENANT_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "auth",
  "www",
  "app",
  "static",
  "assets",
  "cdn",
  "localhost",
]);

export function proxy(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  // Strip client-supplied tenant headers to prevent spoofing
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-tenant-slug");

  // Extract tenant subdomain
  const rawSubdomain = hostname.split(".")[0] ?? "";

  if (rawSubdomain && !RESERVED_SUBDOMAINS.has(rawSubdomain)) {
    if (!TENANT_SLUG_REGEX.test(rawSubdomain)) {
      return new NextResponse("Invalid store identifier", { status: 400 });
    }

    // Set verified tenant slug header for downstream storefront components
    requestHeaders.set("x-tenant-slug", rawSubdomain);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static chunks)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
