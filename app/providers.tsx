"use client"

import { useState } from "react"

// Conditionally import React Query to avoid build errors if not installed
let QueryClientProvider: any = null
let ReactQueryDevtools: any = null
let QueryClient: any = null

try {
  const reactQuery = require("@tanstack/react-query")
  const reactQueryDevtools = require("@tanstack/react-query-devtools")
  QueryClientProvider = reactQuery.QueryClientProvider
  QueryClient = reactQuery.QueryClient
  ReactQueryDevtools = reactQueryDevtools.ReactQueryDevtools
} catch (e) {
  // React Query not installed, will use pass-through
  console.warn("React Query not installed. Run: npm install @tanstack/react-query @tanstack/react-query-devtools")
}

export function Providers({ children }: { children: React.ReactNode }) {
  // If React Query is available, use it
  if (QueryClientProvider && QueryClient) {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 60 * 1000, // 1 minute
              refetchOnWindowFocus: false,
              retry: 1,
              refetchOnMount: true,
              refetchOnReconnect: true,
            },
            mutations: {
              retry: 1,
            },
          },
        })
    )

    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && ReactQueryDevtools && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    )
  }

  // Fallback: pass-through if React Query not installed
  return <>{children}</>
}

