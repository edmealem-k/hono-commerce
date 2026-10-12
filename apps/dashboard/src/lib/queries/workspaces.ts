"use client";

import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

import type { InferResponseType } from "hono/client";

export type WorkspacesResponse = InferResponseType<
  typeof api.users.me.workspaces.$get,
  200
>;

export function useWorkspacesQuery(initialData?: WorkspacesResponse | null) {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await api.users.me.workspaces.$get();
      if (!response.ok) {
        throw new Error("Unable to load workspaces");
      }
      return response.json();
    },
    initialData: initialData ?? undefined,
  });
}
