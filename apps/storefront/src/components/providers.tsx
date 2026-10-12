"use client";

import { getQueryClient } from "@/lib/query-client";
import { Toaster } from "@hono-commerce/ui/components/sonner";
import { TooltipProvider } from "@hono-commerce/ui/components/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <NuqsAdapter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
          <ReactQueryDevtools />
        </QueryClientProvider>
        <Toaster richColors />
      </ThemeProvider>
    </NuqsAdapter>
  );
}
