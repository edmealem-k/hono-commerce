import { cn } from "@hono-commerce/ui/lib/utils";

import { WorkspaceHeader } from "./workspace-header";

import type { WorkspaceHeaderProps } from "./workspace-types";
import type { ReactNode } from "react";

export function WorkspaceShell({
  header,
  children,
  className,
}: {
  header: WorkspaceHeaderProps;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-background flex min-h-svh flex-col", className)}>
      <WorkspaceHeader {...header} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
