import { createServerApi } from "@/lib/api-server";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@hono-commerce/ui/components/empty";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminWorkspaceShell } from "./_components/admin-workspace-shell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const api = await createServerApi();
  const response = await api.users.me.workspaces.$get();
  const responseStatus: number = response.status;

  if (responseStatus === 401) {
    redirect("/sign-in?callbackUrl=/");
  }

  if (!response.ok) {
    throw new Error("Unable to authorize the platform workspace");
  }

  const responseBody = await response.json();
  if (!responseBody.data) {
    throw new Error("Platform authorization response did not include data");
  }
  const canAccessPlatform = responseBody.data.platform.canAccess;
  if (!canAccessPlatform) {
    return (
      <Empty className="min-h-svh">
        <EmptyHeader>
          <ShieldCheck className="text-muted-foreground size-6" />
          <EmptyTitle>Platform access required</EmptyTitle>
          <EmptyDescription>
            Your account does not have permission to open the platform
            workspace.
          </EmptyDescription>
        </EmptyHeader>
        <Button nativeButton={false} render={<Link href="/" />}>
          Return to workspaces
        </Button>
      </Empty>
    );
  }

  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>;
}
