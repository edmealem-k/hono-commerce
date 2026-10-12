"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { routes } from "@/lib/routes";
import { Button } from "@hono-commerce/ui/components/button";
import { WorkspaceSidebarShell } from "@hono-commerce/ui/shared/workspace-shell/workspace-sidebar-shell";
import { Package, ShoppingCart, Users, Store } from "lucide-react";
import { usePathname } from "next/navigation";

export function TenantWorkspaceShell({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const navigation = [
    { label: "Overview", href: routes.tenant.root, icon: <Store /> },
    { label: "Products", href: routes.tenant.products, icon: <Package /> },
    { label: "Orders", href: routes.tenant.orders, icon: <ShoppingCart /> },
    { label: "Team", href: routes.tenant.team, icon: <Users /> },
  ].map((item) => ({
    ...item,
    active:
      item.href === "/"
        ? pathname === "/"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
  }));
  const activeItem = navigation.find((item) => item.active);

  return (
    <WorkspaceSidebarShell
      brand={{
        name: slug,
        description: "Merchant workspace",
        mark: slug.slice(0, 1).toUpperCase() || "S",
      }}
      navigation={navigation}
      header={{
        title: activeItem?.label ?? "Store workspace",
        breadcrumbs: [
          { label: "Workspace manager", href: "/" },
          { label: slug },
          ...(activeItem ? [{ label: activeItem.label }] : []),
        ],
      }}
      footer={
        <>
          <ModeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            nativeButton={false}
            render={<a href="/" />}
          >
            <Store data-icon="inline-start" />
            Workspace manager
          </Button>
        </>
      }
    >
      <div className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">{children}</div>
    </WorkspaceSidebarShell>
  );
}
