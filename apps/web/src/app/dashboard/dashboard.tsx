"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { Button } from "@hono-commerce/ui/components/button";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard({
  customerState,
  session,
}: {
  customerState: ReturnType<typeof authClient.customer.state>;
  session: typeof authClient.$Infer.Session;
}) {
  const privateData = useQuery(trpc.privateData.queryOptions());
  console.log("customerState", customerState);
  console.log("session", session);

  const hasProSubscription =
    (customerState?.activeSubscriptions?.length ?? 0) > 0;

  return (
    <>
      <p>API: {privateData.data?.message}</p>
      <p>Plan: {hasProSubscription ? "Pro" : "Free"}</p>
      {hasProSubscription ? (
        <Button onClick={async () => await authClient.customer.portal()}>
          Manage Subscription
        </Button>
      ) : (
        <Button
          onClick={async () => await authClient.checkout({ slug: "pro" })}
        >
          Upgrade to Pro
        </Button>
      )}
    </>
  );
}
