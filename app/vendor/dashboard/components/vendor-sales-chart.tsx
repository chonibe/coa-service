"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SalesDataPoint {
  date: string
  sales: number
  revenue: number
}

interface VendorSalesChartProps {
  vendorName: string
}

export function VendorSalesChart({ vendorName }: VendorSalesChartProps) {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/vendor/stats")

        if (!response.ok) {
          throw new Error(`Failed to fetch sales data: ${response.status}`)
        }

        const data = await response.json()
        setSalesData(data.salesByDate || [])
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [vendorName])

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Custom tooltip formatter
  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{formatDate(label)}</p>
          <p className="text-sm">
            <span className="text-[#8884d8]">●</span> Sales: {payload[0].value}
          </p>
          <p className="text-sm">
            <span className="text-[#82ca9d]">●</span> Revenue: {formatCurrency(payload[1].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (salesData.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground">
        No sales data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={formatDate} />
        <YAxis yAxisId="left" orientation="left" label={{ value: "Sales", angle: -90, position: "insideLeft" }} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(value) => `$${value}`}
          label={{ value: "Revenue", angle: 90, position: "insideRight" }}
        />
        <Tooltip content={customTooltip} />
        <Legend />
        <Bar dataKey="sales" name="Sales" fill="#8884d8" yAxisId="left" />
        <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" yAxisId="right" />
      </BarChart>
    </ResponsiveContainer>
  )
}
