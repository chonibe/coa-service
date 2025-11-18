import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Query keys for vendor data
export const vendorQueryKeys = {
  all: ["vendor"] as const,
  profile: () => [...vendorQueryKeys.all, "profile"] as const,
  stats: () => [...vendorQueryKeys.all, "stats"] as const,
  salesAnalytics: (range?: string, from?: string, to?: string) =>
    [...vendorQueryKeys.all, "sales-analytics", range, from, to] as const,
  messages: () => [...vendorQueryKeys.all, "messages"] as const,
  messagesThread: (threadId: string) => [...vendorQueryKeys.messages(), threadId] as const,
  notifications: (unreadOnly?: boolean) => [...vendorQueryKeys.all, "notifications", unreadOnly] as const,
  products: () => [...vendorQueryKeys.all, "products"] as const,
  payouts: () => [...vendorQueryKeys.all, "payouts"] as const,
}

// Vendor Profile Query
export function useVendorProfile() {
  return useQuery({
    queryKey: vendorQueryKeys.profile(),
    queryFn: async () => {
      const response = await fetch("/api/vendor/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch vendor profile")
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Vendor Stats Query
export function useVendorStats() {
  return useQuery({
    queryKey: vendorQueryKeys.stats(),
    queryFn: async () => {
      const response = await fetch("/api/vendor/stats", {
        cache: "no-store",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch vendor stats")
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// Sales Analytics Query
export function useSalesAnalytics(range?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: vendorQueryKeys.salesAnalytics(range, from, to),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (range) params.set("range", range)
      if (from) params.set("from", from)
      if (to) params.set("to", to)

      const response = await fetch(`/api/vendor/sales-analytics?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to fetch sales analytics")
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Messages Query
export function useVendorMessages(threadId?: string) {
  return useQuery({
    queryKey: threadId ? vendorQueryKeys.messagesThread(threadId) : vendorQueryKeys.messages(),
    queryFn: async () => {
      const url = threadId
        ? `/api/vendor/messages?thread_id=${threadId}`
        : "/api/vendor/messages"
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch messages")
      }
      return response.json()
    },
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: threadId ? 10 * 1000 : 30 * 1000, // Poll every 10s for threads, 30s for list
  })
}

// Send Message Mutation
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { threadId?: string; recipientType?: string; recipientId?: string; subject?: string; body: string }) => {
      const response = await fetch("/api/vendor/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error("Failed to send message")
      }
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate messages queries to refetch
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messages() })
      if (data.threadId) {
        queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messagesThread(data.threadId) })
      }
    },
  })
}

// Notifications Query
export function useVendorNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: vendorQueryKeys.notifications(unreadOnly),
    queryFn: async () => {
      const response = await fetch(`/api/vendor/notifications?unread_only=${unreadOnly}&limit=20`)
      if (!response.ok) {
        throw new Error("Failed to fetch notifications")
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  })
}

// Mark Notification as Read Mutation
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vendor/notifications/${id}/read`, {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.notifications() })
    },
  })
}

// Mark All Notifications as Read Mutation
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/vendor/notifications/read-all", {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.notifications() })
    },
  })
}

// Mark Thread as Read Mutation
export function useMarkThreadRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/vendor/messages/${threadId}/read`, {
        method: "PUT",
      })
      if (!response.ok) {
        throw new Error("Failed to mark thread as read")
      }
      return response.json()
    },
    onSuccess: (_, threadId) => {
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messages() })
      queryClient.invalidateQueries({ queryKey: vendorQueryKeys.messagesThread(threadId) })
    },
  })
}

