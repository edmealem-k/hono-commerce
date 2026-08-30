import { env } from "@hono-commerce/env/dashboard";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: new URL(
    "/api/v1/auth",
    getServerUrl(env.NEXT_PUBLIC_SERVER_URL),
  ).toString(),
});
