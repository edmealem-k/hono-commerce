import { createServerApi } from "@/lib/api-server";
import { redirect } from "next/navigation";

import { AccountUnavailable, SignInForm } from "./sign-in-form";

function getSafeCallbackPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; email?: string }>;
}) {
  const { callbackUrl, email } = await searchParams;
  const callbackPath = getSafeCallbackPath(callbackUrl);
  const api = await createServerApi();
  const response = await api.users.me.workspaces.$get();
  const responseStatus: number = response.status;

  if (responseStatus === 200) {
    redirect(callbackPath);
  }

  if (responseStatus === 403) {
    return <AccountUnavailable />;
  }

  if (responseStatus !== 401) {
    throw new Error("Unable to verify the current authentication state");
  }

  return <SignInForm callbackPath={callbackPath} initialEmail={email ?? ""} />;
}
