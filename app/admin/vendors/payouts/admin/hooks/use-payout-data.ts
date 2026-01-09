import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import type { PendingPayout, PayoutHistory, RedemptionRequest, PayoutPagination } from "../types"

export function usePayoutData() {
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([])
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([])
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PayoutPagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const { toast } = useToast()

  const fetchRedemptionRequests = useCallback(async () => {
    setIsLoadingRequests(true)
    try {
      const response = await fetch("/api/admin/payouts/requests")
      if (!response.ok) {
        throw new Error("Failed to fetch redemption requests")
      }
      const data = await response.json()
      setRedemptionRequests(data.requests || [])
    } catch (err: any) {
      console.error("Error fetching redemption requests:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to fetch redemption requests",
      })
    } finally {
      setIsLoadingRequests(false)
    }
  }, [toast])

  const fetchPayoutData = useCallback(
    async (page: number = pagination.page) => {
      try {
        // Fetch pending payouts with pagination
        const pendingResponse = await fetch(
          `/api/vendors/payouts/pending?page=${page}&pageSize=${pagination.pageSize}`
        )
        if (!pendingResponse.ok) {
          throw new Error("Failed to fetch pending payouts")
        }
        const pendingData = await pendingResponse.json()
        setPendingPayouts(pendingData.payouts || [])
        if (pendingData.pagination) {
          setPagination(pendingData.pagination)
        }

        // Fetch payout history
        const historyResponse = await fetch("/api/vendors/payouts/history")
        if (!historyResponse.ok) {
          throw new Error("Failed to fetch payout history")
        }
        const historyData = await historyResponse.json()
        setPayoutHistory(historyData.payouts || [])
      } catch (err: any) {
        console.error("Error fetching payout data:", err)
        setError(err.message || "Failed to fetch payout data")
      }
    },
    [pagination.page, pagination.pageSize]
  )

  const initializeData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Initialize payout functions
      await fetch("/api/vendors/init-payout-functions", {
        method: "POST",
      })

      // Initialize payout tables
      await fetch("/api/vendors/init-payout-tables", {
        method: "POST",
      })

      // Fetch all data
      await Promise.all([fetchPayoutData(), fetchRedemptionRequests()])
    } catch (err: any) {
      console.error("Error initializing data:", err)
      setError(err.message || "Failed to initialize data")
    } finally {
      setIsLoading(false)
    }
  }, [fetchPayoutData, fetchRedemptionRequests])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const refresh = useCallback(async () => {
    await Promise.all([fetchPayoutData(), fetchRedemptionRequests()])
    toast({
      title: "Data refreshed",
      description: "Payout data has been updated.",
    })
  }, [fetchPayoutData, fetchRedemptionRequests, toast])

  return {
    pendingPayouts,
    payoutHistory,
    redemptionRequests,
    isLoading,
    isLoadingRequests,
    error,
    pagination,
    setPagination,
    fetchPayoutData,
    fetchRedemptionRequests,
    refresh,
  }
}








