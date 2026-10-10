"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type VerifyState = "verifying" | "success" | "error";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("verifying");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function handleVerification() {
      if (!token) {
        if (isMounted) {
          setState("error");
          setErrorMessage(
            "Missing magic link verification token. Please request a new sign-in link.",
          );
        }
        return;
      }

      try {
        const { error } = await authClient.magicLink.verify({
          query: { token },
        });

        if (error) {
          if (isMounted) {
            setState("error");
            setErrorMessage(
              error.message ||
                "This sign-in link has expired or has already been used.",
            );
          }
          return;
        }

        if (isMounted) {
          setState("success");
          // Redirect after short delay so user sees confirmation
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }
      } catch {
        if (isMounted) {
          setState("error");
          setErrorMessage("Failed to verify sign-in link. Please try again.");
        }
      }
    }

    handleVerification();

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  if (state === "verifying") {
    return (
      <Card className="border-border/80 py-6 text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center">
            <Spinner className="text-primary size-8" />
          </div>
          <CardTitle className="text-xl font-bold">
            Verifying your sign-in
          </CardTitle>
          <CardDescription className="text-sm">
            Please wait while we authenticate your session...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state === "success") {
    return (
      <Card className="border-border/80 py-6 text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Authenticated successfully
          </CardTitle>
          <CardDescription className="text-sm">
            Welcome back! Redirecting you to your workspace...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Spinner className="text-muted-foreground mx-auto size-5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="pb-2 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
          <AlertCircle className="size-6" />
        </div>
        <CardTitle className="text-xl font-bold">Verification Failed</CardTitle>
        <CardDescription className="mt-1 text-sm">
          {errorMessage || "We could not verify your sign-in link."}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <Link href="/sign-in" className="w-full">
          <Button className="w-full">Request new sign-in link</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/80 py-6 text-center shadow-lg">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center">
              <Spinner className="text-primary size-8" />
            </div>
            <CardTitle className="text-xl font-bold">Loading...</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
