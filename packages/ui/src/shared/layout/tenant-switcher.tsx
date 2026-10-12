"use client";

import { Button } from "@hono-commerce/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hono-commerce/ui/components/dropdown-menu";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  StoreIcon,
} from "lucide-react";
import { useState } from "react";

export interface TenantEntry {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  role?: string | null;
  logoUrl?: string | null;
}

export interface TenantSwitcherProps {
  tenants: TenantEntry[];
  currentTenantId?: string;
  onSelectTenant: (tenant: TenantEntry) => void;
  onCreateTenant?: () => void;
}

export function TenantSwitcher({
  tenants,
  currentTenantId,
  onSelectTenant,
  onCreateTenant,
}: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const activeTenant =
    tenants.find((t) => t.id === currentTenantId) || tenants[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-border/60 bg-background/80 h-10 w-full justify-between gap-2 px-3 text-left shadow-xs"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                <StoreIcon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-none font-semibold">
                  {activeTenant?.name ?? "Select Store"}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate text-[10px] leading-tight">
                  {activeTenant?.slug
                    ? `${activeTenant.slug}.store`
                    : "Store management"}
                </p>
              </div>
            </div>
            <ChevronsUpDownIcon className="text-muted-foreground size-3.5 shrink-0 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56 p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-muted-foreground px-2 py-1 text-[10px] font-bold tracking-wider uppercase">
            Your Stores & Brands
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {tenants.map((tenant) => {
            const isSelected = tenant.id === activeTenant?.id;
            return (
              <DropdownMenuItem
                key={tenant.id}
                onClick={() => onSelectTenant(tenant)}
                className="flex cursor-pointer items-center justify-between px-2 py-1.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tenant.name}</p>
                  <p className="text-muted-foreground truncate text-[10px]">
                    {tenant.slug}
                  </p>
                </div>
                {isSelected && (
                  <CheckIcon className="text-primary ml-2 size-3.5 shrink-0" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        {onCreateTenant && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onCreateTenant}
              className="text-primary flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs font-medium"
            >
              <PlusIcon className="size-3.5" />
              Create new store
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
