import { env } from "@hono-commerce/env/storefront";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount (/api/v1/auth everywhere)
  baseURL: new URL(
    "/api/v1/auth",
    getServerUrl(env.NEXT_PUBLIC_SERVER_URL),
  ).toString(),
});
