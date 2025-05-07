"use client"

import { useState, useEffect } from "react"
import { Period } from "@/app/vendor/dashboard/components/period-selector"

interface VendorStats {
  totalSales: number
  totalRevenue: number
  salesGrowth: number
  revenueGrowth: number
  conversionRate: number
  conversionGrowth: number
  totalProducts: number
  recentActivity: Array<{
    title: string
    time: string
  }>
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
  data: VendorStats | null
  isLoading: boolean
  error: Error | null
}

export function useVendorData(period: Period = "30d"): UseVendorDataReturn {
  const [data, setData] = useState<VendorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/stats/sales?period=${period}`)
        if (!response.ok) {
          throw new Error("Failed to fetch vendor data")
        }
        const currentData = await response.json()

        // Calculate growth percentages
        const previousPeriod = getPreviousPeriod(period)
        const previousResponse = await fetch(`/api/vendor/stats/sales?period=${previousPeriod}`)
        const previousData = await previousResponse.json()

        const salesGrowth = calculateGrowth(currentData.totalSales, previousData.totalSales)
        const revenueGrowth = calculateGrowth(currentData.totalRevenue, previousData.totalRevenue)

        // Calculate conversion rate (assuming we have total views from somewhere)
        const totalViews = 1000 // This should come from your analytics
        const conversionRate = (currentData.totalSales / totalViews) * 100
        const previousConversionRate = (previousData.totalSales / totalViews) * 100
        const conversionGrowth = calculateGrowth(conversionRate, previousConversionRate)

        // Generate recent activity from sales data
        const recentActivity = currentData.salesByDate
          .slice(-5)
          .map((sale: any) => ({
            title: `Sold ${sale.sales} items for $${sale.revenue.toFixed(2)}`,
            time: new Date(sale.date).toLocaleDateString(),
          }))

        if (isMounted) {
          setData({
            totalSales: currentData.totalSales,
            totalRevenue: currentData.totalRevenue,
            salesGrowth,
            revenueGrowth,
            conversionRate: Math.round(conversionRate * 10) / 10,
            conversionGrowth,
            totalProducts: currentData.salesByProduct.length,
            recentActivity,
          })
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("An error occurred"))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [period])

  return { data, isLoading, error }
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

function getPreviousPeriod(period: Period): Period {
  switch (period) {
    case "7d":
      return "7d"
    case "30d":
      return "30d"
    case "90d":
      return "90d"
    case "1y":
      return "1y"
    case "all":
      return "1y"
    default:
      return "30d"
  }
}
