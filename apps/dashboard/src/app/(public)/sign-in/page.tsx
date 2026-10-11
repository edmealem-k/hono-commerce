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
import { Input } from "@hono-commerce/ui/components/input";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

type RequestStatus = "idle" | "loading" | "error" | "success";

function SignInContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams?.get("email") || "";
  const callbackUrl = searchParams?.get("callbackUrl") || "/verify";

  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.magicLink({
        email: trimmedEmail,
        name: trimmedName || undefined,
        callbackURL: callbackUrl,
      });

      if (error) {
        setErrorMessage(error.message || "Failed to send sign-in link");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setStatus("error");
    }
  }

  // Success Screen
  if (status === "success") {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="pb-2 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">Check your inbox</CardTitle>
          <CardDescription className="mt-1 text-sm">
            We sent a secure magic link to{" "}
            <span className="text-foreground font-semibold">{email}</span>.
            Click the link in the email to sign in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-center">
          <div className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
            Can&apos;t find the email? Check your spam folder or wait a few
            moments. The link will expire in 15 minutes.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStatus("idle");
              setErrorMessage(null);
            }}
          >
            Use a different email
          </Button>
          <div className="text-muted-foreground mt-2 text-center text-xs">
            Back to{" "}
            <Link href="/" className="text-primary font-medium hover:underline">
              homepage
            </Link>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="pb-4">
        <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
          <Mail className="size-5" />
        </div>
        <CardTitle className="text-xl font-bold">Welcome</CardTitle>
        <CardDescription className="text-sm">
          Enter your email to sign in or create an account with a secure magic
          link.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {status === "error" && errorMessage && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-2 rounded-lg border p-3 text-xs">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-foreground text-xs font-semibold"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@store.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
              autoFocus
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="name"
                className="text-foreground text-xs font-semibold"
              >
                Full Name
              </label>
              <span className="text-muted-foreground text-[11px]">
                Optional for existing accounts
              </span>
            </div>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading"}
              className="h-10 text-sm"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="h-10 w-full font-medium"
            disabled={status === "loading" || !email.trim()}
          >
            {status === "loading" ? (
              "Sending link..."
            ) : (
              <>
                <span>Continue with Email</span>
                <ArrowRight className="ml-1.5 size-4" />
              </>
            )}
          </Button>
          <p className="text-muted-foreground text-center text-[11px]">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
