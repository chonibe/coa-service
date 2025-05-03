"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, RefreshCw } from "lucide-react"

interface SalesData {
  month: string
  sales: number
  revenue: number
}

interface VendorSalesData {
  totalSales: number
  totalRevenue: number
  monthlySales: SalesData[]
}

interface VendorSalesChartProps {
  vendorName: string
  onRefresh?: () => Promise<void>
}

export function VendorSalesChart({ vendorName, onRefresh }: VendorSalesChartProps) {
  const [data, setData] = useState<VendorSalesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchSalesData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching vendor sales data...")
      const response = await fetch("/api/vendor/sales")

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const salesData = await response.json()
      console.log("Sales data received:", salesData)

      setData(salesData)
    } catch (err) {
      console.error("Error fetching sales data:", err)
      setError(err instanceof Error ? err.message : "Failed to load sales data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesData()
  }, [vendorName])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefresh) {
        await onRefresh()
      }
      await fetchSalesData()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format month for display (e.g., "2023-01" to "Jan 2023")
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
  }

  // Format month for mobile display (e.g., "2023-01" to "Jan")
  const formatMonthMobile = (month: string) => {
    const [year, monthNum] = month.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1)
    return date.toLocaleDateString("en-US", { month: "short" })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px] sm:min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] text-center p-4">
        <p className="text-muted-foreground mb-2">Error loading sales data</p>
        <p className="text-xs sm:text-sm text-destructive">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 flex items-center gap-2 px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Try Again
        </button>
      </div>
    )
  }

  if (!data || !data.monthlySales || data.monthlySales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] text-center p-4">
        <p className="text-muted-foreground">No sales data available yet</p>
        <p className="text-xs sm:text-sm mt-2">Once you make your first sale, data will appear here.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 flex items-center gap-2 px-3 py-1 text-sm bg-muted rounded-md hover:bg-muted/80"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 flex-1">
          <div className="bg-muted p-3 sm:p-4 rounded-lg text-center">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Sales</h3>
            <p className="text-lg sm:text-2xl font-bold">{data.totalSales}</p>
          </div>
          <div className="bg-muted p-3 sm:p-4 rounded-lg text-center">
            <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-2">Total Revenue</h3>
            <p className="text-lg sm:text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="ml-2 p-2 rounded-full hover:bg-muted"
          disabled={isRefreshing}
          title="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Refresh</span>
        </button>
      </div>

      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickFormatter={(value) => (window.innerWidth < 640 ? formatMonthMobile(value) : formatMonth(value))}
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              interval={window.innerWidth < 640 ? 1 : 0}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              width={window.innerWidth < 640 ? 25 : 35}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: window.innerWidth < 640 ? 10 : 12 }}
              tickFormatter={(value) => `$${value}`}
              width={window.innerWidth < 640 ? 35 : 45}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                return [value, "Items Sold"]
              }}
              labelFormatter={formatMonth}
              contentStyle={{ fontSize: window.innerWidth < 640 ? "12px" : "14px" }}
            />
            <Legend wrapperStyle={{ fontSize: window.innerWidth < 640 ? "12px" : "14px" }} />
            <Bar dataKey="sales" name="Items Sold" fill="#8884d8" yAxisId="left" />
            <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" yAxisId="right" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
