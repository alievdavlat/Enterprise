"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * App-wide React Query client. Defaults chosen for an admin where most data
 * is read-many / changes-occasionally:
 *
 *   - `staleTime: 5min` — data feels fresh long enough that switching pages
 *     doesn't refetch every list. Mutations still call invalidateQueries on
 *     their own keys.
 *   - `gcTime: 30min` — keep cached results around so quick back-and-forth
 *     between settings pages is instant.
 *   - `refetchOnWindowFocus: false` — admins often have the tab in the
 *     background while editing code in another window; auto-refetching
 *     interrupts in-progress forms.
 *   - `retry: 1` — one auto-retry is enough; more just delays the user
 *     seeing the toast when the server is genuinely down.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
