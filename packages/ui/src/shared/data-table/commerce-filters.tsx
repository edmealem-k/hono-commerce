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
import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

export interface FilterSelectItem {
  type: "select";
  key: string;
  placeholder: string;
  value?: string | null;
  options: FilterSelectOption[];
  onValueChange: (val: string) => void;
}

export interface CommerceFiltersProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  filters?: FilterSelectItem[];
  onClear?: () => void;
  isFiltered?: boolean;
  leading?: React.ReactNode;
  className?: string;
}

export function CommerceFilters({
  search,
  filters = [],
  onClear,
  isFiltered = false,
  leading,
  className,
}: CommerceFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 py-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {leading}
        {search && <ExpandableSearch {...search} />}

        {filters.map((filter) => (
          <div key={filter.key} className="w-[150px]">
            <Select
              value={filter.value || "ALL"}
              onValueChange={(v) => {
                if (v) filter.onValueChange(v);
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-xs"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {isFiltered && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground h-9 px-2 text-xs"
          >
            <XIcon className="mr-1 size-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

function ExpandableSearch({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isExpanded = isFocused || Boolean(value);

  return (
    <div
      className={cn(
        "relative flex h-9 items-center rounded-lg border border-border/80 bg-background transition-all duration-200",
        isExpanded ? "w-64" : "w-44 focus-within:w-64",
      )}
    >
      <SearchIcon className="text-muted-foreground pointer-events-none absolute left-2.5 size-3.5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="placeholder:text-muted-foreground size-full bg-transparent pr-7 pl-8 text-xs outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-muted-foreground hover:text-foreground absolute right-2 flex size-4 items-center justify-center"
        >
          <XIcon className="size-3" />
        </button>
      )}
    </div>
  );
}
