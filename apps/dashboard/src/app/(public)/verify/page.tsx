"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = authClient.useSession();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const verificationError = searchParams.get("error");

  useEffect(() => {
    if (!session.isPending && session.data?.user && !verificationError) {
      router.replace(nextPath);
    }
  }, [
    nextPath,
    router,
    session.data?.user,
    session.isPending,
    verificationError,
  ]);

  if (verificationError || (!session.isPending && !session.data?.user)) {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="pb-2 text-center">
          <div className="bg-destructive/10 text-destructive mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Verification failed
          </CardTitle>
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

  return (
    <Card className="border-border/80 py-6 text-center shadow-lg">
      <CardHeader>
        <div className="mx-auto mb-2 flex size-12 items-center justify-center">
          <Spinner className="text-primary size-8" />
        </div>
        <CardTitle className="text-xl font-bold">
          Completing your sign-in
        </CardTitle>
        <CardDescription className="text-sm">
          Your email has been verified. Redirecting to your workspace…
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/80 py-6 text-center shadow-lg">
          <CardHeader>
            <Spinner className="text-primary mx-auto size-8" />
            <CardTitle className="text-xl font-bold">Loading…</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
