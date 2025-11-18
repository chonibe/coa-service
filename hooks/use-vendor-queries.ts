import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

// Query keys for vendor data
export const vendorQueryKeys = {
  all: ["vendor"] as const,
  profile: () => [...vendorQueryKeys.all, "profile"] as const,
  stats: () => [...vendorQueryKeys.all, "stats"] as const,
  salesAnalytics: (params?: { range?: string; from?: string; to?: string }) =>
    [...vendorQueryKeys.all, "sales-analytics", params] as const,
  messages: (params?: { threadId?: string; page?: number; limit?: number }) =>
    [...vendorQueryKeys.all, "messages", params] as const,
  notifications: (params?: { unreadOnly?: boolean; limit?: number }) =>
    [...vendorQueryKeys.all, "notifications", params] as const,
  payouts: () => [...vendorQueryKeys.all, "payouts"] as const,
  products: () => [...vendorQueryKeys.all, "products"] as const,
}

// Fetch functions
const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  })
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized")
    }
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || error.message || "Request failed")
  }
  return response.json()
}

// Vendor profile query
export function useVendorProfile() {
  return useQuery({
    queryKey: vendorQueryKeys.profile(),
    queryFn: () => fetchWithCredentials("/api/vendor/profile"),
    staleTime: 5 * 60 * 1000, // 5 minutes - profile doesn't change often
    retry: 1,
  })
}

// Vendor stats query
export function useVendorStats() {
  return useQuery({
    queryKey: vendorQueryKeys.stats(),
    queryFn: () => fetchWithCredentials("/api/vendor/stats"),
    staleTime: 30 * 1000, // 30 seconds - stats change more frequently
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Sales analytics query
export function useSalesAnalytics(params?: { range?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: vendorQueryKeys.salesAnalytics(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.range) searchParams.set("range", params.range)
      if (params?.from) searchParams.set("from", params.from)
      if (params?.to) searchParams.set("to", params.to)
      return fetchWithCredentials(`/api/vendor/sales-analytics?${searchParams.toString()}`)
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: true,
  })
}

// Messages query
export function useVendorMessages(params?: { threadId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: vendorQueryKeys.messages(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.threadId) searchParams.set("thread_id", params.threadId)
      if (params?.page) searchParams.set("page", params.page.toString())
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      return fetchWithCredentials(`/api/vendor/messages?${searchParams.toString()}`)
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds for new messages
  })
}

// Notifications query
export function useVendorNotifications(params?: { unreadOnly?: boolean; limit?: number }) {
  return useQuery({
    queryKey: vendorQueryKeys.notifications(params),
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.unreadOnly) searchParams.set("unread_only", "true")
      if (params?.limit) searchParams.set("limit", params.limit.toString())
      return fetchWithCredentials(`/api/vendor/notifications?${searchParams.toString()}`)
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds for new notifications
  })
}

// Payouts query
export function useVendorPayouts() {
  return useQuery({
    queryKey: vendorQueryKeys.payouts(),
    queryFn: () => fetchWithCredentials("/api/vendor/payouts"),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Send message mutation
export function useSendMessage() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: { subject: string; body: string; recipientType: string }) => {
      return fetchWithCredentials("/api/vendor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate messages queries to refetch
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messages() })
    },
    onError: (error: Error) => {
      if (error.message === "Unauthorized") {
        router.push("/login")
      }
    },
  })
}

// Mark message as read mutation
export function useMarkMessageRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      return fetchWithCredentials(`/api/vendor/messages/${threadId}/read`, {
        method: "PUT",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messages() })
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.notifications() })
    },
  })
}

// Mark notification as read mutation
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return fetchWithCredentials(`/api/vendor/notifications/${id}/read`, {
        method: "PUT",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.notifications() })
    },
  })
}

// Mark all notifications as read mutation
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return fetchWithCredentials("/api/vendor/notifications/read-all", {
        method: "PUT",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.notifications() })
    },
  })
}

// Update vendor profile mutation
export function useUpdateVendorProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return fetchWithCredentials("/api/vendor/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      // Invalidate profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.profile() })
    },
  })
}

// Update vendor settings mutation
export function useUpdateVendorSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      return fetchWithCredentials("/api/vendor/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.profile() })
    },
  })
}
