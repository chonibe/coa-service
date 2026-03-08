"use client"

import { useState } from "react"
import { ShopAuthProvider } from "@/lib/shop/ShopAuthContext"

// Conditionally import React Query to avoid build errors if not installed
let QueryClientProvider: any = null
let ReactQueryDevtools: any = null
let QueryClient: any = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dependency
  const reactQuery = require("@tanstack/react-query")
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional dependency
  const reactQueryDevtools = require("@tanstack/react-query-devtools")
  QueryClientProvider = reactQuery.QueryClientProvider
  QueryClient = reactQuery.QueryClient
  ReactQueryDevtools = reactQueryDevtools.ReactQueryDevtools
} catch {
  // React Query not installed, will use pass-through
  console.warn("React Query not installed. Run: npm install @tanstack/react-query @tanstack/react-query-devtools")
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      QueryClient
        ? new QueryClient({
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
        : null
  )

  if (QueryClientProvider && queryClient) {
    return (
      <QueryClientProvider client={queryClient}>
        <ShopAuthProvider>
          {children}
          {process.env.NODE_ENV === "development" && ReactQueryDevtools && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </ShopAuthProvider>
      </QueryClientProvider>
    )
  }

  return <ShopAuthProvider>{children}</ShopAuthProvider>
}

