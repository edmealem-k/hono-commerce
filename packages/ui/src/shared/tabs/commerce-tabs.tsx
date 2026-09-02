"use client";

import { useDragScroll } from "@hono-commerce/ui/hooks/use-drag-scroll";
import { cn } from "@hono-commerce/ui/lib/utils";
import { useState, type ReactNode } from "react";

export interface CommerceTabItem {
  value: string;
  label: string;
  icon?: React.ElementType;
  badge?: number | string;
  content?: ReactNode;
  disabled?: boolean;
}

export interface CommerceTabsProps {
  tabs: CommerceTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function CommerceTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
}: CommerceTabsProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue || tabs[0]?.value || "",
  );
  const activeValue = value !== undefined ? value : internalValue;
  const { ref, isDragging } = useDragScroll();

  const handleSelect = (val: string) => {
    if (isDragging) return;
    setInternalValue(val);
    onValueChange?.(val);
  };

  const activeTab = tabs.find((t) => t.value === activeValue);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <nav className="border-border/60 relative flex w-full overflow-hidden border-b">
        <div
          ref={ref}
          className={cn(
            "scrollbar-none flex w-full touch-pan-x items-center gap-2 overflow-x-auto py-1",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          {tabs.map((tab) => {
            const isActive = tab.value === activeValue;
            const Icon = tab.icon;

            return (
              <button
                key={tab.value}
                type="button"
                disabled={tab.disabled}
                onClick={() => handleSelect(tab.value)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  tab.disabled && "pointer-events-none opacity-40",
                )}
              >
                {Icon && <Icon className="size-3.5 shrink-0" />}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <div className="bg-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab?.content && (
        <div className="animate-in fade-in-50 duration-200">
          {activeTab.content}
        </div>
      )}
    </div>
  );
}
