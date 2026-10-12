import { Badge } from "@hono-commerce/ui/components/badge";
import { Button } from "@hono-commerce/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@hono-commerce/ui/components/empty";
import { Skeleton } from "@hono-commerce/ui/components/skeleton";
import { cn } from "@hono-commerce/ui/lib/utils";
import { Bell, Check, ExternalLink } from "lucide-react";

export interface NotificationViewModel {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
  actionUrl: string | null;
}

export function NotificationPanel({
  notifications,
  unreadCount,
  isLoading = false,
  isError = false,
  onRead,
}: {
  notifications: readonly NotificationViewModel[];
  unreadCount: number;
  isLoading?: boolean;
  isError?: boolean;
  onRead?: (notification: NotificationViewModel) => void;
}) {
  return (
    <div className="w-[min(24rem,calc(100vw-2rem))]">
      <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-muted-foreground text-xs">
            Recent account activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary">{unreadCount} unread</Badge>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3 p-3" aria-label="Loading notifications">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <Empty className="p-6">
          <EmptyHeader>
            <EmptyTitle>Notifications unavailable</EmptyTitle>
            <EmptyDescription>Try again shortly.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : notifications.length === 0 ? (
        <Empty className="p-6">
          <EmptyHeader>
            <Bell className="text-muted-foreground size-5" />
            <EmptyTitle>You&apos;re all caught up</EmptyTitle>
            <EmptyDescription>New activity will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="max-h-80 overflow-y-auto p-1">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={onRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: NotificationViewModel;
  onRead?: (notification: NotificationViewModel) => void;
}) {
  return (
    <div
      className={cn(
        "hover:bg-muted/60 flex gap-3 rounded-md p-3 text-left transition-colors",
        !notification.isRead && "bg-primary/5",
      )}
    >
      <div className="bg-primary/10 text-primary mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
        <Bell className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium">{notification.title}</p>
          {!notification.isRead && (
            <span className="bg-primary mt-1 size-1.5 shrink-0 rounded-full" />
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {notification.message}
        </p>
        <div className="mt-2 flex items-center gap-1">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onRead?.(notification)}
            >
              <Check className="size-3" />
              Mark read
            </Button>
          )}
          {notification.actionUrl && (
            <Button
              variant="ghost"
              size="xs"
              render={<a href={notification.actionUrl} />}
            >
              Open
              <ExternalLink className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
