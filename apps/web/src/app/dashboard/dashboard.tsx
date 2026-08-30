"use client";

import { authClient } from "@/lib/auth-client";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <div className="mt-4 rounded-lg border p-4">
      <p className="text-muted-foreground text-sm">
        Logged in as: {session?.user?.email}
      </p>
    </div>
  );
}
