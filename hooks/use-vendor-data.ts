"use client"

import { useState, useEffect, useCallback } from "react"

interface VendorData {
  vendor: {
    id: string
    name: string
    email: string
    paypalEmail?: string
  }
  stats: {
    totalSales: number
    totalQuantity: number
    pendingPayout: number
  }
  products: Array<{
    id: string
    title: string
    image?: string
    price: number
    quantity: number
    totalSales: number
  }>
  payouts: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
    paidAt?: string
  }>
  salesData: Array<{
    date: string
    amount: number
  }>
}

export function useVendorData() {
  const [data, setData] = useState<VendorData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetch vendor profile
      const profileRes = await fetch("/api/vendor/profile")
      if (!profileRes.ok) throw new Error("Failed to fetch vendor profile")
      const profileData = await profileRes.json()

      // Fetch vendor stats
      const statsRes = await fetch("/api/vendor/stats")
      if (!statsRes.ok) throw new Error("Failed to fetch vendor stats")
      const statsData = await statsRes.json()

      // Fetch vendor products
      const productsRes = await fetch("/api/vendor/sales")
      if (!productsRes.ok) throw new Error("Failed to fetch vendor products")
      const productsData = await productsRes.json()

      // Combine all data
      setData({
        vendor: profileData.vendor,
        stats: statsData.stats,
        products: productsData.products || [],
        payouts: profileData.payouts || [],
        salesData: statsData.salesData || [],
      })
    } catch (err) {
      console.error("Error fetching vendor data:", err)
      setError(err instanceof Error ? err : new Error("Failed to fetch vendor data"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  }
}
