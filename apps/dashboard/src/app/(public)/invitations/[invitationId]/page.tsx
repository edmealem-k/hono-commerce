"use client";

import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { toSubdomainUrl } from "@hono-commerce/types/routes";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hono-commerce/ui/components/card";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { Spinner } from "@hono-commerce/ui/components/spinner";
import { StatusPill } from "@hono-commerce/ui/shared/dashboard/status-pill";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  LogIn,
  Shield,
  UserCheck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import type { InferResponseType } from "hono/client";

type InvitationData = InferResponseType<
  (typeof api.invitations)[":invitationId"]["$get"],
  200
>["data"];

type PageState =
  | "loading"
  | "ready"
  | "accepting"
  | "declining"
  | "accepted"
  | "declined"
  | "error";

function InvitationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const invitationId =
    typeof params?.invitationId === "string" ? params.invitationId : "";
  const token = searchParams?.get("token") || "";

  const { data: sessionData, isPending: isSessionPending } =
    authClient.useSession();

  const [state, setState] = useState<PageState>("loading");
  const [data, setData] = useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInvitation() {
      if (!invitationId || !token) {
        if (isMounted) {
          setState("error");
          setErrorMessage(
            "Missing invitation token or identifier. Please check your invitation link.",
          );
        }
        return;
      }

      try {
        const res = await api.invitations[":invitationId"].$get({
          param: { invitationId },
          query: { token },
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          let errorMsg = "This invitation is invalid or has expired.";
          if (errBody && "error" in errBody) {
            if (typeof errBody.error === "string") {
              errorMsg = errBody.error;
            } else if (
              errBody.error &&
              "issues" in errBody.error &&
              Array.isArray(errBody.error.issues) &&
              errBody.error.issues[0]?.message
            ) {
              errorMsg = errBody.error.issues[0].message;
            }
          }
          if (isMounted) {
            setState("error");
            setErrorMessage(errorMsg);
          }
          return;
        }

        const body = await res.json();
        if (isMounted) {
          setData(body.data);
          setState("ready");
        }
      } catch {
        if (isMounted) {
          setState("error");
          setErrorMessage("Failed to load invitation. Please try again.");
        }
      }
    }

    loadInvitation();

    return () => {
      isMounted = false;
    };
  }, [invitationId, token]);

  async function handleUpdateStatus(status: "accepted" | "rejected") {
    if (!invitationId || !token) return;

    setState(status === "accepted" ? "accepting" : "declining");
    setErrorMessage(null);

    try {
      const res = await api.invitations[":invitationId"].$patch({
        param: { invitationId },
        json: { status, token },
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        let errorMsg = "Failed to update invitation status.";
        if (errBody && "error" in errBody) {
          if (typeof errBody.error === "string") {
            errorMsg = errBody.error;
          } else if (
            errBody.error &&
            "issues" in errBody.error &&
            Array.isArray(errBody.error.issues) &&
            errBody.error.issues[0]?.message
          ) {
            errorMsg = errBody.error.issues[0].message;
          }
        }
        setState("error");
        setErrorMessage(errorMsg);
        return;
      }

      if (status === "accepted") {
        setState("accepted");
        setTimeout(() => {
          if (data?.tenant?.slug) {
            window.location.href = toSubdomainUrl(data.tenant.slug, "/", {
              portal: "dashboard",
            });
          } else {
            router.push("/");
          }
        }, 1500);
      } else {
        setState("declined");
      }
    } catch {
      setState("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  }

  // 1. Loading State
  if (state === "loading" || isSessionPending) {
    return (
      <Card className="border-border/80 shadow-lg">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="flex gap-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // 2. Error / Expired State
  if (state === "error") {
    return (
      <Card className="border-border/80 py-4 text-center shadow-lg">
        <CardHeader>
          <div className="bg-destructive/10 text-destructive mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <AlertCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Invitation Expired or Invalid
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            {errorMessage ||
              "This invitation link is invalid, has expired, or has already been used."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // 3. Accepted Success State
  if (state === "accepted") {
    return (
      <Card className="border-border/80 py-6 text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Invitation Accepted!
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            You are now a member of{" "}
            <span className="text-foreground font-semibold">
              {data?.tenant.name}
            </span>
            . Redirecting to your store dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Spinner className="text-muted-foreground mx-auto size-5" />
        </CardContent>
      </Card>
    );
  }

  // 4. Declined State
  if (state === "declined") {
    return (
      <Card className="border-border/80 py-6 text-center shadow-lg">
        <CardHeader>
          <div className="bg-muted text-muted-foreground mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <XCircle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Invitation Declined
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            You have declined the invitation to join {data?.tenant.name}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 pt-4">
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Determine user auth match
  const currentUserEmail = sessionData?.user?.email?.toLowerCase().trim();
  const inviteEmail = data?.email?.toLowerCase().trim();
  const isAuthenticated = Boolean(sessionData?.user);
  const isEmailMatch = isAuthenticated && currentUserEmail === inviteEmail;

  const currentPath =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : `/invitations/${invitationId}?token=${token}`;
  const signInUrl = `/sign-in?email=${encodeURIComponent(data?.email || "")}&callbackUrl=${encodeURIComponent(currentPath)}`;

  // 5. Active Ready View (Pending Invitation)
  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader className="border-border/60 border-b pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg font-bold shadow-xs">
              <Building2 className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">
                {data?.tenant.name}
              </CardTitle>
              <CardDescription className="text-xs">
                Store slug: @{data?.tenant.slug}
              </CardDescription>
            </div>
          </div>
          <StatusPill
            label={data?.role === "owner" ? "Owner Role" : "Member Role"}
            tone={data?.role === "owner" ? "primary" : "info"}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="bg-muted/40 border-border/40 space-y-2 rounded-lg border p-3.5">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <UserCheck className="size-3.5" />
            <span>
              Invited by{" "}
              <strong className="text-foreground">
                {data?.inviter.name || data?.inviter.email || "Store Admin"}
              </strong>
            </span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Shield className="size-3.5" />
            <span>
              Recipient:{" "}
              <strong className="text-foreground">{data?.email}</strong>
            </span>
          </div>
        </div>

        {/* Authenticated with matching email -> Ready to accept */}
        {isEmailMatch && (
          <p className="text-muted-foreground text-xs leading-relaxed">
            You are signed in as{" "}
            <strong className="text-foreground">{currentUserEmail}</strong>.
            Accepting will add you as a{" "}
            <strong className="text-foreground">{data?.role}</strong> to{" "}
            {data?.tenant.name}.
          </p>
        )}

        {/* Unauthenticated -> Prompt to sign in or create account */}
        {!isAuthenticated && (
          <div className="bg-primary/5 border-primary/20 space-y-2 rounded-lg border p-3 text-xs">
            <p className="text-foreground font-medium">
              Authentication required
            </p>
            <p className="text-muted-foreground">
              This invitation was sent to <strong>{data?.email}</strong>. Please
              sign in or create an account to accept.
            </p>
          </div>
        )}

        {/* Authenticated with MISMATCHED email -> Warning banner */}
        {isAuthenticated && !isEmailMatch && (
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-semibold">Email mismatch</p>
            <p>
              You are currently signed in as <strong>{currentUserEmail}</strong>
              , but this invitation was sent to <strong>{data?.email}</strong>.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2.5 pt-2">
        {/* Match -> Show Accept / Decline */}
        {isEmailMatch && (
          <div className="flex w-full gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              disabled={state === "accepting" || state === "declining"}
              onClick={() => handleUpdateStatus("rejected")}
            >
              {state === "declining" ? "Declining..." : "Decline"}
            </Button>
            <Button
              className="flex-1 font-medium"
              disabled={state === "accepting" || state === "declining"}
              onClick={() => handleUpdateStatus("accepted")}
            >
              {state === "accepting" ? (
                <>
                  <Spinner className="mr-1.5 size-3.5" />
                  <span>Joining...</span>
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </div>
        )}

        {/* Not authenticated -> Show "Continue as [email]" */}
        {!isAuthenticated && (
          <div className="flex w-full flex-col gap-2">
            <Link href={signInUrl} className="w-full">
              <Button className="w-full font-medium">
                <LogIn className="mr-1.5 size-4" />
                <span>Continue as {data?.email}</span>
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="text-muted-foreground w-full text-xs"
              onClick={() => handleUpdateStatus("rejected")}
            >
              Decline invitation
            </Button>
          </div>
        )}

        {/* Email Mismatch -> Show Switch Account */}
        {isAuthenticated && !isEmailMatch && (
          <div className="flex w-full flex-col gap-2">
            <Button
              className="w-full font-medium"
              onClick={async () => {
                await authClient.signOut();
                router.push(signInUrl);
              }}
            >
              <LogIn className="mr-1.5 size-4" />
              <span>Sign in as {data?.email}</span>
              <ArrowRight className="ml-1.5 size-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-muted-foreground w-full text-xs"
              onClick={() => handleUpdateStatus("rejected")}
            >
              Decline invitation
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-border/80 shadow-lg">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
