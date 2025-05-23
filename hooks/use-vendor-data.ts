"use client"

import { useState, useEffect } from "react"

interface VendorStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  pendingPayout: number
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
  refreshData: () => Promise<void>
}

export function useVendorData(): UseVendorDataReturn {
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsResponse, productsResponse] = await Promise.all([
        fetch("/api/vendor/stats"),
        fetch("/api/vendors/products"),
      ])

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

      // Mock sales data for now
      const salesData = statsData
        ? {
            totalSales: statsData.totalRevenue || 0,
            productsSold: statsData.totalSales || 0,
            conversionRate: 3.2,
            chartData: [],
            recentActivity: [],
          }
        : null

      setSalesData(salesData)
    } catch (err) {
      console.error("Error in useVendorData:", err)
      setError(err instanceof Error ? err : new Error("Unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = async () => {
    await fetchData()
  }

  return { stats, products, salesData, isLoading, error, refreshData }
}
