import { env } from "@hono-commerce/env/dashboard";
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

const PUBLIC_PATHS = ["/sign-in", "/verify", "/invitations"];

export function proxy(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const rootHostname = env.NEXT_PUBLIC_ROOT_DOMAIN.split(":")[0]?.toLowerCase();
  const url = req.nextUrl.clone();

  if (
    rootHostname &&
    hostname !== rootHostname &&
    !hostname.endsWith(`.${rootHostname}`)
  ) {
    return new NextResponse("Unrecognized dashboard host", { status: 400 });
  }

  // Strip any client-supplied tenant headers to prevent header injection
  const requestHeaders = new Headers(req.headers);
  for (const header of ["x-tenant-slug", "x-org-slug", "x-current-path"]) {
    requestHeaders.delete(header);
  }

  // Public routes bypass tenant rewriting and serve directly from /(public)
  if (PUBLIC_PATHS.some((path) => url.pathname.startsWith(path))) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // 1. Platform Superadmin: admin.localhost:3002 or admin.yourdomain.com
  if (hostname.startsWith("admin.")) {
    // If the path doesn't already start with /admin, rewrite it internally
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
    }
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  // 2. Tenant Store Subdomain: [tenantSlug].localhost:3002 or [tenantSlug].yourdomain.com
  const rawSubdomain =
    hostname !== rootHostname ? (hostname.split(".")[0] ?? "") : "";

  if (rawSubdomain && !RESERVED_SUBDOMAINS.has(rawSubdomain)) {
    if (!TENANT_SLUG_REGEX.test(rawSubdomain)) {
      return new NextResponse("Invalid store identifier", { status: 400 });
    }

    // Set verified tenant slug header for downstream server components
    requestHeaders.set("x-tenant-slug", rawSubdomain);

    // If the path doesn't already start with /[slug], rewrite it internally
    if (!url.pathname.startsWith(`/${rawSubdomain}`)) {
      url.pathname = `/${rawSubdomain}${url.pathname}`;
    }

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  const firstSegment = url.pathname.split("/")[1] ?? "";
  if (firstSegment && TENANT_SLUG_REGEX.test(firstSegment)) {
    return new NextResponse("Tenant context must come from a verified host", {
      status: 404,
    });
  }

  // 3. Fallback: Root host (localhost:3002 or dashboard.yourdomain.com) -> serves portal selector /
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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
