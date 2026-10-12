"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hono-commerce/ui/components/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@hono-commerce/ui/components/sheet";
import { useIsMobile } from "@hono-commerce/ui/hooks/use-mobile";

import type { ReactElement, ReactNode } from "react";

export function ResponsiveActionPanel({
  title,
  description,
  trigger,
  children,
}: {
  title: string;
  description?: string;
  trigger: ReactElement;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" className="max-h-[85svh]">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="min-h-0 overflow-y-auto px-4 pb-6">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="p-0">
        {children}
      </PopoverContent>
    </Popover>
  );
}
