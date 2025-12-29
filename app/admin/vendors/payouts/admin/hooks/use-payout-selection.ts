import { useState, useCallback } from "react"
import type { PendingPayout } from "../types"

export function usePayoutSelection(pendingPayouts: PendingPayout[]) {
  const [selectedPayouts, setSelectedPayouts] = useState<string[]>([])

  const togglePayoutSelection = useCallback((vendorName: string) => {
    setSelectedPayouts((prev) =>
      prev.includes(vendorName) ? prev.filter((name) => name !== vendorName) : [...prev, vendorName]
    )
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedPayouts.length === pendingPayouts.length) {
      setSelectedPayouts([])
    } else {
      setSelectedPayouts(pendingPayouts.map((payout) => payout.vendor_name))
    }
  }, [selectedPayouts.length, pendingPayouts])

  const clearSelection = useCallback(() => {
    setSelectedPayouts([])
  }, [])

  const getSelectedPayoutData = useCallback(() => {
    return pendingPayouts.filter((payout) => selectedPayouts.includes(payout.vendor_name))
  }, [pendingPayouts, selectedPayouts])

  return {
    selectedPayouts,
    setSelectedPayouts,
    togglePayoutSelection,
    toggleSelectAll,
    clearSelection,
    getSelectedPayoutData,
  }
}


