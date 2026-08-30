import {
  defaultShouldDehydrateQuery,
  isServer,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error("Failed to load data", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
          action: {
            label: "Retry",
            onClick: () => {
              void query.fetch();
            },
          },
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error("Operation failed", {
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
