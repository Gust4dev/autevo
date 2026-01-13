"use client";

import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { useState } from "react";
import superjson from "superjson";
import "@/lib/superjson-config"; // Register custom transformers
import type { AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: "always",
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : String(error);
            if (message.includes("Account suspended")) {
              window.location.href = "/suspended";
            } else if (message.includes("pending activation")) {
              window.location.href = "/activate";
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            const message =
              error instanceof Error ? error.message : String(error);
            if (message.includes("Account suspended")) {
              window.location.href = "/suspended";
            } else if (message.includes("pending activation")) {
              window.location.href = "/activate";
            }
          },
        }),
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
