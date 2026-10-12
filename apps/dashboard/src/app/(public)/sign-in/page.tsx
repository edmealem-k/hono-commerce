"use client";

import { authClient } from "@/lib/auth-client";
import {
  magicLinkSignInSchema,
  type MagicLinkSignInInput,
} from "@hono-commerce/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@hono-commerce/ui/components/alert";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@hono-commerce/ui/components/field";
import { Input } from "@hono-commerce/ui/components/input";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type RequestStatus = "idle" | "loading" | "error" | "success";

function getSafeCallbackPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = authClient.useSession();
  const initialEmail = searchParams.get("email") ?? "";
  const callbackPath = getSafeCallbackPath(searchParams.get("callbackUrl"));
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<MagicLinkSignInInput>({
    resolver: zodResolver(magicLinkSignInSchema),
    defaultValues: { email: initialEmail, name: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!session.isPending && session.data?.user) {
      router.replace(callbackPath);
    }
  }, [callbackPath, router, session.data?.user, session.isPending]);

  async function handleSubmit(values: MagicLinkSignInInput) {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const verificationPath = `/verify?next=${encodeURIComponent(callbackPath)}`;
      const { error } = await authClient.signIn.magicLink({
        email: values.email.toLowerCase(),
        name: values.name || undefined,
        callbackURL: verificationPath,
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

  if (status === "success") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CheckCircle2 className="text-primary mx-auto size-8" />
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a secure magic link to {form.getValues("email")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Mail />
            <AlertTitle>Link expires in 15 minutes</AlertTitle>
            <AlertDescription>
              Check your spam folder if the message does not arrive shortly.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStatus("idle")}
          >
            Use a different email
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const emailError = form.formState.errors.email;
  const nameError = form.formState.errors.name;

  return (
    <Card>
      <CardHeader>
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
          <Mail className="size-5" />
        </div>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Use your email to receive a secure magic link.
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(handleSubmit)} noValidate>
        <CardContent>
          <FieldGroup>
            {status === "error" && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>Unable to continue</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <Field data-invalid={Boolean(emailError)}>
              <FieldLabel htmlFor="email">Email address</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@store.com"
                aria-invalid={Boolean(emailError)}
                disabled={status === "loading"}
                {...form.register("email")}
              />
              <FieldError errors={[emailError]} />
            </Field>
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                aria-invalid={Boolean(nameError)}
                disabled={status === "loading"}
                {...form.register("name")}
              />
              <FieldDescription>
                Optional for existing accounts.
              </FieldDescription>
              <FieldError errors={[nameError]} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <Spinner data-icon="inline-start" /> Sending link...
              </>
            ) : (
              <>
                Continue with email
                <ArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
          <Link href="/" className="text-primary text-xs hover:underline">
            Return to workspace manager
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader className="gap-3">
            <Skeleton className="size-10" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
