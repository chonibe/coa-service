"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"

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

export function VendorSalesChart({ vendorName }: { vendorName: string }) {
  const [data, setData] = useState<VendorSalesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSalesData() {
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

    fetchSalesData()
  }, [vendorName])

  // Format month for display (e.g., "2023-01" to "Jan 2023")
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(monthNum) - 1, 1)
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
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
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground mb-2">Error loading sales data</p>
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.monthlySales || data.monthlySales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-muted-foreground">No sales data available yet</p>
            <p className="text-sm mt-2">Once you make your first sale, data will appear here.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="bg-muted p-4 rounded-lg text-center flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sales</h3>
            <p className="text-2xl font-bold">{data.totalSales}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlySales} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              formatter={(value, name) => {
                if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                return [value, "Items Sold"]
              }}
              labelFormatter={formatMonth}
            />
            <Legend />
            <Bar dataKey="sales" name="Items Sold" fill="#8884d8" yAxisId="left" />
            <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" yAxisId="right" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
