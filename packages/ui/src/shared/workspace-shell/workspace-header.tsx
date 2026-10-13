import { cn } from "@hono-commerce/ui/lib/utils";

import { WorkspaceBreadcrumbs } from "./workspace-breadcrumbs";

import type { WorkspaceHeaderProps } from "./workspace-types";

export function WorkspaceHeader({
  title,
  breadcrumbs = [],
  leading,
  actions,
  children,
}: WorkspaceHeaderProps) {
  return (
    <header className="border-border/70 bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b px-4 py-2 backdrop-blur">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            {title}
          </h1>
          {children && (
            <div className={cn("min-w-0", "hidden sm:block")}>{children}</div>
          )}
        </div>
        {breadcrumbs.length > 0 && (
          <div className="mt-0.5 hidden sm:block">
            <WorkspaceBreadcrumbs items={breadcrumbs} />
          </div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </header>
  );
}
