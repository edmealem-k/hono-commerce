"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hono-commerce/ui/components/dropdown-menu";
import { cn } from "@hono-commerce/ui/lib/utils";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EyeOffIcon,
} from "lucide-react";

import type { Column } from "@tanstack/react-table";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort() && !column.getCanHide()) {
    return (
      <div
        className={cn("text-xs font-semibold text-muted-foreground", className)}
      >
        {title}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              className="data-[state=open]:bg-accent -ml-3 h-8 text-xs font-semibold"
            >
              <span>{title}</span>
              {column.getIsSorted() === "desc" ? (
                <ArrowDownIcon className="text-primary ml-1.5 size-3.5" />
              ) : column.getIsSorted() === "asc" ? (
                <ArrowUpIcon className="text-primary ml-1.5 size-3.5" />
              ) : (
                <ChevronsUpDownIcon className="ml-1.5 size-3.5 opacity-50" />
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {column.getCanSort() && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUpIcon className="text-muted-foreground/70 mr-2 size-3.5" />
                Ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDownIcon className="text-muted-foreground/70 mr-2 size-3.5" />
                Descending
              </DropdownMenuItem>
              {column.getIsSorted() && (
                <DropdownMenuItem onClick={() => column.clearSorting()}>
                  Clear sort
                </DropdownMenuItem>
              )}
            </>
          )}
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOffIcon className="text-muted-foreground/70 mr-2 size-3.5" />
                Hide column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
