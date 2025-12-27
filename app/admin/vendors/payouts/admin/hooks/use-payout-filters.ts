import { useState, useMemo, useCallback } from "react"
import type { PendingPayout, PayoutHistory } from "../types"

export interface PayoutFilters {
  searchQuery: string
  statusFilter: string
  paymentMethodFilter: string
  dateRange: { start: string; end: string }
  amountRange: { min: string; max: string }
  includePaid?: boolean
}

export function usePayoutFilters() {
  const [filters, setFilters] = useState<PayoutFilters>({
    searchQuery: "",
    statusFilter: "all",
    paymentMethodFilter: "all",
    dateRange: { start: "", end: "" },
    amountRange: { min: "", max: "" },
    includePaid: false,
  })

  const updateFilter = useCallback((key: keyof PayoutFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
      statusFilter: "all",
      paymentMethodFilter: "all",
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      includePaid: false,
    })
  }, [])

  const filterPendingPayouts = useCallback(
    (payouts: PendingPayout[]) => {
      return payouts.filter((payout) => {
        const matchesSearch = payout.vendor_name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
        return matchesSearch
      })
    },
    [filters.searchQuery]
  )

  const filterPayoutHistory = useCallback(
    (history: PayoutHistory[]) => {
      return history.filter((payout) => {
        const matchesSearch = payout.vendor_name
          .toLowerCase()
          .includes(filters.searchQuery.toLowerCase())
        const matchesStatus = filters.statusFilter === "all" || payout.status === filters.statusFilter
        const matchesPaymentMethod =
          filters.paymentMethodFilter === "all" ||
          payout.payment_method === filters.paymentMethodFilter

        return matchesSearch && matchesStatus && matchesPaymentMethod
      })
    },
    [filters.searchQuery, filters.statusFilter, filters.paymentMethodFilter]
  )

  return {
    filters,
    updateFilter,
    clearFilters,
    filterPendingPayouts,
    filterPayoutHistory,
  }
}

