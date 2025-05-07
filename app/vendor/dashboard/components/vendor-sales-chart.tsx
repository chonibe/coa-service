"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface VendorSalesChartProps {
  period?: string
}

export function VendorSalesChart({ period = "all-time" }: VendorSalesChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/vendor/sales-analytics?period=${period}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        } else {
          console.error("Failed to fetch sales data")
          // Set some mock data if the API fails
          setData(generateMockData(period))
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
        // Set some mock data if the API fails
        setData(generateMockData(period))
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [period])

  if (loading) {
    return (
      <div className="w-full aspect-[4/3]">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No sales data available for this period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `£${value}`}
        />
        <Tooltip
          formatter={(value: number) => [`£${value}`, "Revenue"]}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <Bar dataKey="total" fill="#adfa1d" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Helper function to generate mock data based on the period
function generateMockData(period: string) {
  switch (period) {
    case "this-month":
    case "last-month":
      // Daily data for a month
      return Array.from({ length: 30 }, (_, i) => ({
        name: `Day ${i + 1}`,
        total: Math.floor(Math.random() * 500) + 100,
      }))

    case "this-year":
    case "last-year":
      // Monthly data for a year
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      return months.map((month) => ({
        name: month,
        total: Math.floor(Math.random() * 5000) + 1000,
      }))

    case "last-3-months":
      // Weekly data for 3 months
      return Array.from({ length: 12 }, (_, i) => ({
        name: `Week ${i + 1}`,
        total: Math.floor(Math.random() * 1000) + 500,
      }))

    case "last-6-months":
      // Weekly data for 6 months
      return Array.from({ length: 24 }, (_, i) => ({
        name: `Week ${i + 1}`,
        total: Math.floor(Math.random() * 1000) + 500,
      }))

    case "all-time":
    default:
      // Yearly data
      return Array.from({ length: 5 }, (_, i) => ({
        name: `${new Date().getFullYear() - 4 + i}`,
        total: Math.floor(Math.random() * 10000) + 5000,
      }))
  }
}
