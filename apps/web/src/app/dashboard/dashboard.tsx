"use client";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  console.log({ session });
  const privateData = useQuery(trpc.privateData.queryOptions());

  return (
    <>
      <p>API: {privateData.data?.message}</p>
    </>
  );
}
