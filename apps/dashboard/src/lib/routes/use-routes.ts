"use client";

import { routes } from "@hono-commerce/types/routes";
import { useParams } from "next/navigation";

export function useRoutes() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : undefined;

  return {
    routes,
    slug,
  };
}

export { routes };
