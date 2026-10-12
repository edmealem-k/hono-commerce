"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset,
} from "@hono-commerce/ui/components/sidebar";

import { WorkspaceHeader } from "./workspace-header";

import type { WorkspaceHeaderProps } from "./workspace-types";
import type { ReactNode } from "react";

export interface WorkspaceSidebarNavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
  active?: boolean;
}

export interface WorkspaceSidebarShellProps {
  brand: {
    name: string;
    description: string;
    mark: ReactNode;
  };
  navigation: readonly WorkspaceSidebarNavigationItem[];
  header: WorkspaceHeaderProps;
  footer?: ReactNode;
  children: ReactNode;
}

export function WorkspaceSidebarShell({
  brand,
  navigation,
  header,
  footer,
  children,
}: WorkspaceSidebarShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold">
              {brand.mark}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">{brand.name}</p>
              <p className="text-sidebar-foreground/70 truncate text-xs">
                {brand.description}
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={item.active}
                      tooltip={item.label}
                      render={<a href={item.href} />}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {footer && <SidebarFooter>{footer}</SidebarFooter>}
      </Sidebar>
      <SidebarInset>
        <WorkspaceHeader
          {...header}
          leading={
            <>
              <SidebarTrigger />
              {header.leading}
            </>
          }
        />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
