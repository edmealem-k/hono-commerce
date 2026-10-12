import { createServerApi } from "@/lib/api-server";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountUnavailable } from "../sign-in/sign-in-form";

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function VerificationFailed() {
  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="pb-2 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold">Verification failed</CardTitle>
        <CardDescription className="mt-1 text-sm">
          This sign-in link is invalid or has expired. Request a new link to
          continue.
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-4">
        <Button
          className="w-full"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          Request new sign-in link
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  if (error) {
    return <VerificationFailed />;
  }

  const api = await createServerApi();
  const response = await api.users.me.workspaces.$get();
  const responseStatus: number = response.status;

  if (responseStatus === 200) {
    redirect(getSafeNextPath(next));
  }

  if (responseStatus === 403) {
    return <AccountUnavailable />;
  }

  if (responseStatus === 401) {
    return <VerificationFailed />;
  }

  throw new Error("Unable to verify the completed sign-in");
}
