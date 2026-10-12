import { Skeleton } from "@hono-commerce/ui/components/skeleton";

export function WorkspaceShellSkeleton() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <div className="border-border/70 flex min-h-14 items-center gap-3 border-b px-4 py-2">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </div>
      <div className="flex-1 p-4 sm:p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  );
}
