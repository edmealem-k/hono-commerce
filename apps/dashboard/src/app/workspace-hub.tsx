"use client";

import { authClient } from "@/lib/auth-client";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/lib/queries/notifications";
import {
  useWorkspacesQuery,
  type WorkspacesResponse,
} from "@/lib/queries/workspaces";
import { toSubdomainUrl } from "@hono-commerce/types/routes";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@hono-commerce/ui/components/avatar";
import { Badge } from "@hono-commerce/ui/components/badge";
import { Button } from "@hono-commerce/ui/components/button";
import { Card, CardContent } from "@hono-commerce/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hono-commerce/ui/components/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@hono-commerce/ui/components/empty";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { AppearancePanel } from "@hono-commerce/ui/shared/appearance/appearance-panel";
import { GlobalDrawer } from "@hono-commerce/ui/shared/drawer/global-drawer";
import { useDrawer } from "@hono-commerce/ui/shared/drawer/use-drawer";
import { MultiStepFlow } from "@hono-commerce/ui/shared/forms/multi-step-flow";
import { ResponsiveActionPanel } from "@hono-commerce/ui/shared/layout/responsive-action-panel";
import { NotificationPanel } from "@hono-commerce/ui/shared/notifications/notification-panel";
import { WorkspaceHeader } from "@hono-commerce/ui/shared/workspace-shell/workspace-header";
import {
  Bell,
  ChevronRight,
  Palette,
  Plus,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type WorkspaceData = NonNullable<WorkspacesResponse["data"]>;
type WorkspaceEntry = WorkspaceData["workspaces"][number];

export function WorkspaceHub({
  initialData,
}: {
  initialData: WorkspacesResponse | null;
}) {
  const router = useRouter();
  const session = authClient.useSession();
  const user = session.data?.user;
  const sessionExpired = !session.isPending && !session.data;
  const workspacesQuery = useWorkspacesQuery(initialData, {
    enabled: Boolean(user),
  });
  const notificationsQuery = useNotificationsQuery(undefined, {
    enabled: Boolean(user),
  });
  const markReadMutation = useMarkNotificationReadMutation();
  const { openDrawer } = useDrawer();
  const userName = user?.name || user?.email || "Account";
  const initials = userName.slice(0, 1).toUpperCase();
  const workspaceData = workspacesQuery.data?.data;
  const notificationData = notificationsQuery.data?.data;

  useEffect(() => {
    if (sessionExpired) {
      router.replace("/sign-in?callbackUrl=/");
    }
  }, [router, sessionExpired]);

  const openCreateWorkspace = () => {
    openDrawer({
      naked: true,
      size: "md",
      title: "Create workspace",
      view: (
        <MultiStepFlow
          steps={[
            {
              id: "intro",
              title: "Create a workspace",
              description:
                "Workspace creation will be enabled in tenant onboarding.",
              content: (
                <Empty>
                  <EmptyHeader>
                    <Store className="text-primary size-6" />
                    <EmptyTitle>Tenant onboarding is next</EmptyTitle>
                    <EmptyDescription>
                      The workspace hub is ready. Store details, availability,
                      review, and creation will be added in the
                      tenant-onboarding feature.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ),
            },
          ]}
          currentStep={0}
          canGoNext={false}
          onRequestClose={() => undefined}
        />
      ),
    });
  };

  return (
    <div className="bg-background min-h-svh">
      <WorkspaceHeader
        title="Workspace Manager"
        actions={
          <>
            <ResponsiveActionPanel
              title="Notifications"
              description="Recent workspace activity"
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notifications"
                  className="relative"
                >
                  <Bell className="size-4" />
                  {notificationData?.unreadCount ? (
                    <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full text-[9px] font-semibold">
                      {notificationData.unreadCount > 9
                        ? "9+"
                        : notificationData.unreadCount}
                    </span>
                  ) : null}
                </Button>
              }
            >
              <NotificationPanel
                notifications={notificationData?.items ?? []}
                unreadCount={notificationData?.unreadCount ?? 0}
                isLoading={notificationsQuery.isLoading}
                isError={notificationsQuery.isError}
                onRead={(notification) => {
                  markReadMutation.mutate({
                    notificationId: notification.id,
                    isRead: true,
                  });
                }}
              />
            </ResponsiveActionPanel>
            <ResponsiveActionPanel
              title="Appearance"
              description="Choose Light or Dark mode"
              trigger={
                <Button variant="ghost" size="icon" aria-label="Appearance">
                  <Palette className="size-4" />
                </Button>
              }
            >
              <AppearancePanel />
            </ResponsiveActionPanel>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Account menu"
                  />
                }
              >
                <Avatar size="sm">
                  {user?.image && <AvatarImage src={user.image} alt="" />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <p className="truncate text-xs font-semibold">{userName}</p>
                    {user?.email && (
                      <p className="text-muted-foreground truncate text-[11px] font-normal">
                        {user.email}
                      </p>
                    )}
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/" />}>
                  <UserRound className="size-4" />
                  Personal Workspace
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/" />}>
                  <Store className="size-4" />
                  Workspaces
                </DropdownMenuItem>
                {workspaceData?.platform.canAccess && (
                  <DropdownMenuItem
                    render={<a href={toSubdomainUrl("admin", "/")} />}
                  >
                    <ShieldCheck className="size-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void authClient.signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Workspaces
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Choose where to work
            </h2>
          </div>
          <Button onClick={openCreateWorkspace}>
            <Plus className="size-4" />
            Add workspace
          </Button>
        </div>
        <WorkspaceContent
          query={workspacesQuery}
          sessionExpired={sessionExpired}
          onOpen={(slug) => {
            window.location.assign(toSubdomainUrl(slug, "/"));
          }}
        />
      </main>
      <GlobalDrawer />
    </div>
  );
}

function WorkspaceContent({
  query,
  sessionExpired,
  onOpen,
}: {
  query: ReturnType<typeof useWorkspacesQuery>;
  sessionExpired: boolean;
  onOpen: (slug: string) => void;
}) {
  if (query.isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }
  if (query.isError) {
    if (sessionExpired) {
      return (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Session expired</EmptyTitle>
            <EmptyDescription>
              Sign in again to view your authorized workspaces.
            </EmptyDescription>
          </EmptyHeader>
          <Button nativeButton={false} render={<Link href="/sign-in" />}>
            Sign in
          </Button>
        </Empty>
      );
    }
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Workspaces unavailable</EmptyTitle>
          <EmptyDescription>Refresh the page and try again.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Retry
        </Button>
      </Empty>
    );
  }
  const workspaces = query.data?.data?.workspaces ?? [];
  if (workspaces.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <Store className="text-muted-foreground size-6" />
          <EmptyTitle>No workspaces yet</EmptyTitle>
          <EmptyDescription>
            Create your first workspace to get started.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div className="grid gap-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function WorkspaceCard({
  workspace,
  onOpen,
}: {
  workspace: WorkspaceEntry;
  onOpen: (slug: string) => void;
}) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <Avatar size="lg">
          {workspace.logo && <AvatarImage src={workspace.logo} alt="" />}
          <AvatarFallback>
            {workspace.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="text-muted-foreground mt-1 text-xs capitalize">
            Store · {workspace.role}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant={workspace.status === "active" ? "secondary" : "outline"}
            >
              {workspace.status}
            </Badge>
            {workspace.memberStatus !== "active" && (
              <Badge variant="destructive">
                Membership {workspace.memberStatus}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Open ${workspace.name}`}
            onClick={() => onOpen(workspace.slug)}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
