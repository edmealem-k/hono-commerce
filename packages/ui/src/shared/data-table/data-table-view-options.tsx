"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@hono-commerce/ui/components/dropdown-menu";
import { SlidersHorizontalIcon, CheckIcon } from "lucide-react";

import type { Table, Column } from "@tanstack/react-table";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter(
      (col: Column<TData, unknown>) =>
        typeof col.accessorFn !== "undefined" && col.getCanHide(),
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 gap-1.5 text-xs lg:flex"
          >
            <SlidersHorizontalIcon className="size-3.5" />
            View
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuLabel className="text-xs">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column: Column<TData, unknown>) => {
          const isVisible = column.getIsVisible();
          return (
            <DropdownMenuItem
              key={column.id}
              className="flex items-center justify-between text-xs capitalize"
              onClick={(e) => {
                e.preventDefault();
                column.toggleVisibility(!isVisible);
              }}
            >
              <span>{column.id}</span>
              {isVisible && <CheckIcon className="text-primary size-3.5" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
