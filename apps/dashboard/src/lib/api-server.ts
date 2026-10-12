import { env } from "@hono-commerce/env/dashboard";
import { hc } from "hono/client";
import { headers } from "next/headers";

import { getServerUrl } from "./server-url";

import type { AppType } from "api";

export async function createServerApi() {
  const requestHeaders = await headers();
  const cookie = requestHeaders.get("cookie");
  const tenantSlug = requestHeaders.get("x-tenant-slug");

  const client = hc<AppType>(getServerUrl(env.NEXT_PUBLIC_SERVER_URL), {
    fetch(input: RequestInfo | URL, init?: RequestInit) {
      const forwardedHeaders = new Headers(init?.headers);
      if (cookie) forwardedHeaders.set("cookie", cookie);
      if (tenantSlug) forwardedHeaders.set("x-tenant-slug", tenantSlug);

      return fetch(input, {
        ...init,
        cache: "no-store",
        headers: forwardedHeaders,
      });
    },
  });

  return client.api.v1;
}
