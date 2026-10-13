"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { routes } from "@/lib/routes";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@hono-commerce/ui/components/empty";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { PermissionGate } from "@hono-commerce/ui/shared/auth/permission-gate";
import { WorkspaceSidebarShell } from "@hono-commerce/ui/shared/workspace-shell/workspace-sidebar-shell";
import { Building2, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

export function AdminWorkspaceShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const session = authClient.useSession();
  const navigation = [
    {
      label: "Tenants",
      href: routes.admin.tenants,
      icon: <Building2 />,
    },
  ].map((item) => ({
    ...item,
    active: pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));
  const activeItem = navigation.find((item) => item.active);

  if (session.isPending) {
    return <Skeleton className="min-h-svh w-full" />;
  }

  return (
    <PermissionGate
      user={session.data?.user}
      permission="PLATFORM:READ"
      fallback={
        <Empty className="min-h-svh">
          <EmptyHeader>
            <ShieldCheck className="text-muted-foreground size-6" />
            <EmptyTitle>Platform access required</EmptyTitle>
            <EmptyDescription>
              Your account does not have permission to open the platform
              workspace.
            </EmptyDescription>
          </EmptyHeader>
          <Button nativeButton={false} render={<a href="/" />}>
            Return to workspaces
          </Button>
        </Empty>
      }
    >
      <WorkspaceSidebarShell
        brand={{
          name: "Platform",
          description: "Operations workspace",
          mark: <ShieldCheck />,
        }}
        navigation={navigation}
        header={{
          title: activeItem?.label ?? "Platform workspace",
          breadcrumbs: [
            { label: "Workspace manager", href: "/" },
            { label: "Platform" },
            ...(activeItem ? [{ label: activeItem.label }] : []),
          ],
        }}
        footer={
          <>
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              nativeButton={false}
              render={<a href="/" />}
            >
              <Building2 data-icon="inline-start" />
              Workspace manager
            </Button>
          </>
        }
      >
        <div className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </WorkspaceSidebarShell>
    </PermissionGate>
  );
}
