export type PortalTarget = "storefront" | "dashboard" | "admin" | "api";

export interface BaseUrlOptions {
  subdomain?: string;
  portal?: PortalTarget;
  port?: number;
  rootDomain?: string;
}

export type SubdomainUrlOptions = Omit<BaseUrlOptions, "subdomain">;

/**
 * Returns the base origin URL (e.g. "http://nike.localhost:3002" or "https://nike.shop.com").
 * Works universally across browser, Node/Bun server, RSC, API, and worker environments.
 */
export function getBaseUrl(options?: BaseUrlOptions): string {
  const isProd =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "production";

  if (isProd) {
    const rootDomain =
      options?.rootDomain ||
      (typeof process !== "undefined" &&
        process.env?.NEXT_PUBLIC_ROOT_DOMAIN) ||
      (options?.portal === "storefront" ? "localhost:3001" : "localhost:3002");

    if (options?.subdomain) {
      return `https://${options.subdomain}.${rootDomain}`;
    }
    return `https://${rootDomain}`;
  }

  // Development environment (RFC 6761 *.localhost)
  const defaultPort =
    options?.portal === "storefront"
      ? 3001
      : options?.portal === "api"
        ? 3000
        : 3002;

  const port = options?.port ?? defaultPort;

  if (options?.subdomain) {
    return `http://${options.subdomain}.localhost:${port}`;
  }

  return `http://localhost:${port}`;
}

/**
 * Builds an absolute URL for a subdomain and path.
 * Example:
 * toSubdomainUrl("nike", routes.tenant.products)
 * => Dev:  "http://nike.localhost:3002/products"
 * => Prod: "https://nike.shop.com/products"
 */
export function toSubdomainUrl(
  subdomain: string,
  path: string,
  options?: Omit<BaseUrlOptions, "subdomain">,
): string {
  const base = getBaseUrl({ ...options, subdomain });
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
