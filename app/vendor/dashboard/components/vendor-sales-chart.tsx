"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { useVendorData } from "@/hooks/use-vendor-data"

interface SalesChartProps {
  period?: string
}

export function VendorSalesChart({ period = "all-time" }: SalesChartProps) {
  const { stats, isLoading } = useVendorData()
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    if (stats && stats.salesData && Array.isArray(stats.salesData)) {
      // Use the sales data directly from the stats
      setChartData(formatChartData(stats.salesData, period))
    } else {
      // Fallback to empty array if no data
      setChartData([])
    }
  }, [stats, period])

  // Helper function to format the sales data for the chart
  const formatChartData = (salesData: any[], period: string) => {
    if (!salesData || salesData.length === 0) {
      return []
    }

    try {
      // Group sales by date
      const salesByDate = new Map()

      salesData.forEach((item) => {
        if (!item || !item.date) return

        const dateStr = typeof item.date === "string" ? item.date : String(item.date)
        const date = new Date(dateStr)

        if (isNaN(date.getTime())) return // Skip invalid dates

        const dateKey = date.toISOString().split("T")[0]

        if (salesByDate.has(dateKey)) {
          salesByDate.set(dateKey, salesByDate.get(dateKey) + 1)
        } else {
          salesByDate.set(dateKey, 1)
        }
      })

      // Convert to array and sort by date
      const sortedData = Array.from(salesByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Format based on period
      switch (period) {
        case "this-month":
        case "last-month":
        case "custom":
          // Daily data
          return sortedData.map((item) => {
            const date = new Date(item.date)
            return {
              name: date.getDate().toString(),
              sales: item.count,
            }
          })

        case "last-3-months":
        case "last-6-months":
          // Weekly data
          return aggregateByWeek(sortedData)

        case "this-year":
        case "last-year":
          // Monthly data
          return aggregateByMonth(sortedData)

        case "all-time":
        default:
          // Yearly data
          return aggregateByYear(sortedData)
      }
    } catch (error) {
      console.error("Error formatting chart data:", error)
      return []
    }
  }

  // Helper functions for aggregation
  const aggregateByWeek = (data: any[]) => {
    try {
      const weeklyData = new Map()

      data.forEach((item) => {
        const date = new Date(item.date)
        if (isNaN(date.getTime())) return // Skip invalid dates

        const weekNum = Math.floor(date.getDate() / 7) + 1
        const weekKey = `W${weekNum}`

        if (weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, weeklyData.get(weekKey) + item.count)
        } else {
          weeklyData.set(weekKey, item.count)
        }
      })

      return Array.from(weeklyData.entries())
        .map(([week, count]) => ({
          name: week,
          sales: count,
        }))
        .sort((a, b) => {
          const weekA = Number.parseInt(a.name.substring(1), 10)
          const weekB = Number.parseInt(b.name.substring(1), 10)
          return weekA - weekB
        })
    } catch (error) {
      console.error("Error aggregating by week:", error)
      return []
    }
  }

  const aggregateByMonth = (data: any[]) => {
    try {
      const monthlyData = new Map()
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

      data.forEach((item) => {
        const date = new Date(item.date)
        if (isNaN(date.getTime())) return // Skip invalid dates

        const monthKey = monthNames[date.getMonth()]

        if (monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, monthlyData.get(monthKey) + item.count)
        } else {
          monthlyData.set(monthKey, item.count)
        }
      })

      return monthNames
        .filter((month) => monthlyData.has(month))
        .map((month) => ({
          name: month,
          sales: monthlyData.get(month),
        }))
    } catch (error) {
      console.error("Error aggregating by month:", error)
      return []
    }
  }

  const aggregateByYear = (data: any[]) => {
    try {
      const yearlyData = new Map()

      data.forEach((item) => {
        if (!item.date) return

        const yearPart = String(item.date).split("-")[0]
        if (!yearPart) return

        if (yearlyData.has(yearPart)) {
          yearlyData.set(yearPart, yearlyData.get(yearPart) + item.count)
        } else {
          yearlyData.set(yearPart, item.count)
        }
      })

      return Array.from(yearlyData.entries())
        .map(([year, count]) => ({
          name: year,
          sales: count,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error("Error aggregating by year:", error)
      return []
    }
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No sales data available for this period
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          formatter={(value: number) => [`${value} sales`, "Sales"]}
          labelFormatter={(label) => {
            switch (period) {
              case "this-month":
              case "last-month":
                return `Day ${label}`
              case "last-3-months":
              case "last-6-months":
                return `Week ${label.substring(1)}`
              case "this-year":
              case "last-year":
                return `${label}`
              case "custom":
                return `Day ${label}`
              case "all-time":
              default:
                return `Year ${label}`
            }
          }}
        />
        <Bar dataKey="sales" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}
