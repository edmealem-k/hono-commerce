"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hono-commerce/ui/components/select";
import { cn } from "@hono-commerce/ui/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<
  TData,
> extends React.HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 50, 100],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalCount = table.getFilteredRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 px-2 py-3",
        className,
      )}
      {...props}
    >
      <div className="text-muted-foreground min-w-0 flex-1 text-xs">
        {selectedCount > 0 ? (
          <span>
            <strong className="text-foreground font-semibold">
              {selectedCount}
            </strong>{" "}
            of{" "}
            <strong className="text-foreground font-semibold">
              {totalCount}
            </strong>{" "}
            row(s) selected.
          </span>
        ) : (
          <span>
            Total{" "}
            <strong className="text-foreground font-semibold">
              {totalCount}
            </strong>{" "}
            item(s).
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs font-medium">
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(val) => {
              if (val) table.setPageSize(Number(val));
            }}
          >
            <SelectTrigger className="h-8 w-[4.5rem]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-xs font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="First page"
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Previous page"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Next page"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Last page"
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
