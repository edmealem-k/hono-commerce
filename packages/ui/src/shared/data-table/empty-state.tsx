"use client";

import { Button } from "@hono-commerce/ui/components/button";
import { cn } from "@hono-commerce/ui/lib/utils";
import { AlertCircleIcon, ShieldCheckIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClearFilters?: () => void;
  isFiltered?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title = "No results found",
  description = "No items matching your search criteria were found.",
  action,
  onClearFilters,
  isFiltered = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center",
        className,
      )}
    >
      <div className="bg-muted/50 text-muted-foreground flex size-12 items-center justify-center rounded-full">
        {icon ?? <AlertCircleIcon className="size-6" />}
      </div>
      <h3 className="text-foreground mt-4 text-base font-semibold tracking-tight">
        {title}
      </h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-xs leading-relaxed">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {action}
        {isFiltered && onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export function OperationalEmptyState({
  title = "All clear",
  description = "No actions are required in this lane right now.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-glass-gradient-a border-border/50 flex min-h-[220px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-xs",
        className,
      )}
    >
      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
        <ShieldCheckIcon className="size-6" />
      </div>
      <h3 className="text-foreground mt-4 text-base font-semibold">{title}</h3>
      <p className="text-muted-foreground mx-auto mt-1.5 max-w-md text-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}
