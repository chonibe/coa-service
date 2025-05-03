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
  vendorName?: string
  onRefresh?: () => Promise<void>
}

export function VendorSalesChart({ vendorName, onRefresh }: VendorSalesChartProps) {
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVendor, setCurrentVendor] = useState<string | null>(null)

  // If vendorName is not provided, try to get it from the vendor profile
  useEffect(() => {
    const fetchVendorProfile = async () => {
      if (vendorName) {
        setCurrentVendor(vendorName)
        return
      }

      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setCurrentVendor(data.vendor?.vendor_name || null)
        } else {
          throw new Error("Failed to fetch vendor profile")
        }
      } catch (err) {
        console.error("Error fetching vendor profile:", err)
        setError("Could not determine vendor name")
      }
    }

    fetchVendorProfile()
  }, [vendorName])

  // Fetch sales data when vendor name is available
  useEffect(() => {
    const fetchSalesData = async () => {
      if (!currentVendor) return

      setIsLoading(true)
      setError(null)

      try {
        console.log(`Fetching sales data for vendor: ${currentVendor}`)
        const response = await fetch(`/api/vendor/stats/sales`)

        if (!response.ok) {
          throw new Error(`Failed to fetch sales data: ${response.status}`)
        }

        const data = await response.json()
        console.log(`Received sales data with ${data.salesByDate?.length || 0} data points`)
        setSalesData(data.salesByDate || [])
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    if (currentVendor) {
      fetchSalesData()
    }
  }, [currentVendor])

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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (salesData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        No sales data available for this period
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={salesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDate} />
          <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
          <Tooltip content={customTooltip} />
          <Legend />
          <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#8884d8" />
          <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
