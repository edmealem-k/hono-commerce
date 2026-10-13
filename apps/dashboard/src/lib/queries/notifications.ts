"use client";

import { api } from "@/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { InferResponseType } from "hono/client";

export type NotificationsResponse = InferResponseType<
  typeof api.users.me.notifications.$get,
  200
>;

export function useNotificationsQuery(
  initialData?: NotificationsResponse | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const response = await api.users.me.notifications.$get({
        query: { limit: "20" },
      });
      if (!response.ok) {
        throw new Error("Unable to load notifications");
      }
      return response.json();
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
    initialData: initialData ?? undefined,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      notificationId,
      isRead,
    }: {
      notificationId: string;
      isRead: boolean;
    }) => {
      const response = await api.users.me.notifications[
        ":notificationId"
      ].$patch({
        param: { notificationId },
        json: { isRead },
      });
      if (!response.ok) throw new Error("Unable to update notification");
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications", "me"] });
    },
  });
}
