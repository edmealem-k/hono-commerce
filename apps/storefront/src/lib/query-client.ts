import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query?.meta?.errorMessage === false) return;

        const message =
          (query?.meta?.errorMessage as string) ||
          error.message ||
          "An error occurred while fetching data";

        toast.error(message, {
          action: {
            label: "Retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation?.meta?.errorMessage === false) return;

        const message =
          (mutation?.meta?.errorMessage as string) ||
          error.message ||
          "An error occurred while submitting data";

        toast.error(message);
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export const queryClient = getQueryClient();
