import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbList,
} from "@hono-commerce/ui/components/breadcrumb";

import type { WorkspaceBreadcrumbItem } from "./workspace-types";

export function WorkspaceBreadcrumbs({
  items,
}: {
  items: readonly WorkspaceBreadcrumbItem[];
}) {
  if (items.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <BreadcrumbItem key={`${item.label}-${index}`}>
              {isCurrent || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<a href={item.href} />}>
                  {item.label}
                </BreadcrumbLink>
              )}
              {!isCurrent && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
