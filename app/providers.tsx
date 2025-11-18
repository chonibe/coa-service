"use client"

// React Query will be enabled once @tanstack/react-query is installed
// For now, this is a pass-through component
export function Providers({ children }: { children: React.ReactNode }) {
  // TODO: Uncomment once React Query is installed
  // import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
  // import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
  // const [queryClient] = useState(
  //   () =>
  //     new QueryClient({
  //       defaultOptions: {
  //         queries: {
  //           staleTime: 60 * 1000, // 1 minute
  //           refetchOnWindowFocus: false,
  //           retry: 1,
  //         },
  //         mutations: {
  //           retry: 1,
  //         },
  //       },
  //     })
  // )
  // return (
  //   <QueryClientProvider client={queryClient}>
  //     {children}
  //     <ReactQueryDevtools initialIsOpen={false} />
  //   </QueryClientProvider>
  // )

  return <>{children}</>
}

