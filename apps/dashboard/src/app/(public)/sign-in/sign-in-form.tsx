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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@hono-commerce/ui/components/field";
import { Input } from "@hono-commerce/ui/components/input";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type RequestStatus = "idle" | "loading" | "error" | "success";

export function SignInForm({
  callbackPath,
  initialEmail,
}: {
  callbackPath: string;
  initialEmail: string;
}) {
  const router = useRouter();
  const session = authClient.useSession();
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<MagicLinkSignInInput>({
    resolver: zodResolver(magicLinkSignInSchema),
    defaultValues: { email: initialEmail },
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
      const verificationUrl = new URL(
        verificationPath,
        window.location.origin,
      ).toString();
      const { error } = await authClient.signIn.magicLink({
        email: values.email.toLowerCase(),
        callbackURL: verificationUrl,
        errorCallbackURL: verificationUrl,
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
            <AlertTitle>Use the link to continue</AlertTitle>
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

  return (
    <Card>
      <CardHeader>
        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
          <Mail className="size-5" />
        </div>
        <CardTitle>Log in to your account</CardTitle>
        <CardDescription>
          Enter your email and we will send you a secure sign-in link.
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
                autoFocus
                {...form.register("email")}
              />
              <FieldError errors={[emailError]} />
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
        </CardFooter>
      </form>
    </Card>
  );
}
