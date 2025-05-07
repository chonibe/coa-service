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
  last30DaysTotal: { sales: number; revenue: number }
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

      // Fetch sales data
      const salesResponse = await fetch("/api/vendor/stats/sales")
      if (!salesResponse.ok) {
        throw new Error(`Failed to fetch sales data: ${salesResponse.status}`)
      }
      const salesStats = await salesResponse.json()

      setStats(statsData)
      setProducts(productsData.products || [])

      // Use real sales data
      const salesData = {
        totalSales: salesStats.totalRevenue || 0,
        productsSold: salesStats.totalSales || 0,
        conversionRate: calculateConversionRate(salesStats.totalSales, productsData.products?.length || 0),
        chartData: salesStats.salesByDate || [],
        recentActivity: generateRecentActivity(salesStats.salesByDate || []),
        last30DaysTotal: salesStats.last30DaysTotal || { sales: 0, revenue: 0 }
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

// Helper function to calculate conversion rate
function calculateConversionRate(totalSales: number, totalProducts: number): number {
  if (!totalProducts) return 0
  return Number(((totalSales / totalProducts) * 100).toFixed(1))
}

// Helper function to generate recent activity from sales data
function generateRecentActivity(salesData: any[]): any[] {
  if (!salesData.length) return []
  
  return salesData.slice(-5).map(day => ({
    title: `${day.sales} items sold`,
    date: new Date(day.date).toLocaleDateString(),
    type: 'sale',
    amount: `$${day.revenue.toFixed(2)}`
  }))
}
