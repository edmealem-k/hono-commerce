import { env } from "@hono-commerce/env/dashboard";
import {
  adminClient,
  customSessionClient,
  magicLinkClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { getServerUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: new URL(
    "/api/v1/auth",
    getServerUrl(env.NEXT_PUBLIC_SERVER_URL),
  ).toString(),
  plugins: [magicLinkClient(), adminClient(), customSessionClient()],
});
