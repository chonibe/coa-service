"use client"

import { useState, useEffect } from "react"

interface VendorStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  totalPayout: number
  currency: string
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
  totalRevenue: number
  totalPayout: number
  currency: string
  salesByDate: any[]
  salesByProduct: any[]
  recentActivity: any[]
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

      const [statsResponse, productsResponse, salesResponse] = await Promise.all([
        fetch("/api/vendor/stats"),
        fetch("/api/vendors/products"),
        fetch("/api/vendor/sales-analytics")
      ])

      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch vendor stats: ${statsResponse.status}`)
      }

      if (!productsResponse.ok) {
        throw new Error(`Failed to fetch vendor products: ${productsResponse.status}`)
      }

      if (!salesResponse.ok) {
        throw new Error(`Failed to fetch sales analytics: ${salesResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const productsData = await productsResponse.json()
      const salesAnalyticsData = await salesResponse.json()

      setStats({
        totalProducts: statsData.totalProducts ?? 0,
        totalSales: statsData.totalSales ?? 0,
        totalRevenue: statsData.totalRevenue ?? 0,
        totalPayout: statsData.totalPayout ?? statsData.totalRevenue ?? 0,
        currency: statsData.currency || "USD",
        revenueGrowth: statsData.revenueGrowth,
        salesGrowth: statsData.salesGrowth,
        newProducts: statsData.newProducts,
      })
      setProducts(productsData.products || [])

      // Use real sales data from the analytics endpoint
      const salesData = {
        totalSales: statsData.totalSales ?? 0,
        totalRevenue: statsData.totalRevenue ?? 0,
        totalPayout: statsData.totalPayout ?? statsData.totalRevenue ?? 0,
        currency: statsData.currency || "USD",
        salesByDate: salesAnalyticsData.salesByDate || [],
        salesByProduct: salesAnalyticsData.salesByProduct || [],
        recentActivity: statsData.recentActivity || [],
          }

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
