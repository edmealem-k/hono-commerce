import { env } from "@hono-commerce/env/storefront";
import { hc } from "hono/client";

import { getServerUrl } from "./server-url";

import type { AppType } from "api";

export const apiClient = hc<AppType>(getServerUrl(env.NEXT_PUBLIC_SERVER_URL), {
  fetch(input: RequestInfo | URL, init?: RequestInit) {
    return fetch(input, {
      ...init,
      credentials: "include",
    });
  },
});
