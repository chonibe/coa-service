"use client"

import { useState, useEffect } from "react"
import type { DateRange } from "react-day-picker"

interface VendorStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  pendingPayout: number
  period: string
  salesData: any[]
  dateRange?: {
    start: string
    end: string
  } | null
  revenueGrowth?: number
  salesGrowth?: number
  newProducts?: number
}

interface Product {
  id: string
  title: string
  handle: string
  price: string
  status: string
  vendor: string
  image?: string
  totalSales?: number
  revenue?: number
}

interface SalesData {
  totalSales: number
  productsSold: number
  conversionRate: number
  chartData: any[]
  recentActivity?: any[]
}

interface UseVendorDataReturn {
  stats: VendorStats | null
  products: Product[] | null
  salesData: SalesData | null
  isLoading: boolean
  error: Error | null
  period: string
  setPeriod: (period: string) => void
  customDateRange: DateRange | undefined
  setCustomDateRange: (range: DateRange | undefined) => void
  applyCustomDateRange: () => void
  refreshData: () => Promise<void>
}

export function useVendorData(): UseVendorDataReturn {
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [period, setPeriod] = useState<string>("all-time")
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined)
  const [shouldFetch, setShouldFetch] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let url = `/api/vendor/stats?period=${period}`

      // Add custom date range parameters if applicable
      if (period === "custom" && customDateRange?.from && customDateRange?.to) {
        const start = customDateRange.from.toISOString()
        const end = customDateRange.to.toISOString()
        url += `&start=${start}&end=${end}`
      }

      const statsResponse = await fetch(url)
      const productsResponse = await fetch("/api/vendors/products")

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch vendor stats: ${statsResponse.status}`)
      }

      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch vendor products: ${productsResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const productsData = await productsResponse.json()

      setStats(statsData)
      setProducts(productsData.products || [])

      // Create sales data from stats
      const salesData = statsData
        ? {
            totalSales: statsData.totalSales || 0,
            productsSold: statsData.totalSales || 0,
            conversionRate: 3.2,
            chartData: statsData.salesData || [],
          }
        : null

      setSalesData(salesData)
    } catch (err) {
      console.error("Error in useVendorData:", err)
      setError(err instanceof Error ? err : new Error("Unknown error occurred"))
    } finally {
      setIsLoading(false)
      setShouldFetch(false)
    }
  }

  // Apply custom date range and trigger data fetch
  const applyCustomDateRange = () => {
    if (customDateRange?.from && customDateRange?.to) {
      setPeriod("custom")
      setShouldFetch(true)
    }
  }

  useEffect(() => {
    if (shouldFetch) {
      fetchData()
    }
  }, [shouldFetch])

  // When period changes (except to custom), trigger data fetch
  useEffect(() => {
    if (period !== "custom") {
      setShouldFetch(true)
    }
  }, [period])

  const refreshData = async () => {
    setShouldFetch(true)
  }

  return {
    stats,
    products,
    salesData,
    isLoading,
    error,
    period,
    setPeriod,
    customDateRange,
    setCustomDateRange,
    applyCustomDateRange,
    refreshData,
  }
}
