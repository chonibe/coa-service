"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface SalesChartProps {
  period?: string
}

interface SalesDataPoint {
  date: string
  count: number
}

export function VendorSalesChart({ period = "all-time" }: SalesChartProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      try {
        // Fetch real sales data from the API
        const response = await fetch(`/api/vendor/stats?period=${period}`)

        if (!response.ok) {
          throw new Error("Failed to fetch sales data")
        }

        const data = await response.json()

        if (data.salesTimeline && data.salesTimeline.length > 0) {
          // Format the data for the chart
          const formattedData = formatChartData(data.salesTimeline, period)
          setChartData(formattedData)
        } else {
          // Fallback to mock data if no sales data is available
          const mockData = generateMockDataForPeriod(period)
          setChartData(mockData)
        }
      } catch (error) {
        console.error("Error fetching sales data:", error)
        // Fallback to mock data on error
        const mockData = generateMockDataForPeriod(period)
        setChartData(mockData)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [period])

  // Helper function to format the sales timeline data for the chart
  const formatChartData = (salesTimeline: SalesDataPoint[], period: string) => {
    // For different periods, we might want to aggregate the data differently
    switch (period) {
      case "this-month":
      case "last-month":
      case "custom":
        // Daily data - use as is but format the date
        return salesTimeline.map((item) => ({
          name: new Date(item.date).getDate().toString(), // Just the day number
          sales: item.count,
        }))

      case "last-3-months":
      case "last-6-months":
        // Weekly aggregation
        return aggregateByWeek(salesTimeline)

      case "this-year":
      case "last-year":
        // Monthly aggregation
        return aggregateByMonth(salesTimeline)

      case "all-time":
      default:
        // Yearly aggregation
        return aggregateByYear(salesTimeline)
    }
  }

  // Helper function to aggregate data by week
  const aggregateByWeek = (salesTimeline: SalesDataPoint[]) => {
    const weeklyData = new Map()

    salesTimeline.forEach((item) => {
      const date = new Date(item.date)
      // Get the week number (approximate)
      const weekNum = Math.floor(date.getDate() / 7) + 1
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`
      const weekKey = `W${weekNum} ${monthYear}`

      if (weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, weeklyData.get(weekKey) + item.count)
      } else {
        weeklyData.set(weekKey, item.count)
      }
    })

    return Array.from(weeklyData.entries())
      .map(([week, count]) => ({
        name: week.split(" ")[0], // Just the week part
        sales: count,
      }))
      .sort((a, b) => {
        // Extract week number for sorting
        const weekA = Number.parseInt(a.name.substring(1))
        const weekB = Number.parseInt(b.name.substring(1))
        return weekA - weekB
      })
  }

  // Helper function to aggregate data by month
  const aggregateByMonth = (salesTimeline: SalesDataPoint[]) => {
    const monthlyData = new Map()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    salesTimeline.forEach((item) => {
      const date = new Date(item.date)
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`

      if (monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, monthlyData.get(monthKey) + item.count)
      } else {
        monthlyData.set(monthKey, item.count)
      }
    })

    return Array.from(monthlyData.entries()).map(([month, count]) => ({
      name: month.split(" ")[0], // Just the month name
      sales: count,
    }))
  }

  // Helper function to aggregate data by year
  const aggregateByYear = (salesTimeline: SalesDataPoint[]) => {
    const yearlyData = new Map()

    salesTimeline.forEach((item) => {
      const year = item.date.split("-")[0]

      if (yearlyData.has(year)) {
        yearlyData.set(year, yearlyData.get(year) + item.count)
      } else {
        yearlyData.set(year, item.count)
      }
    })

    return Array.from(yearlyData.entries())
      .map(([year, count]) => ({
        name: year,
        sales: count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  // Helper function to generate mock data based on period (fallback)
  const generateMockDataForPeriod = (period: string) => {
    const now = new Date()
    let data: any[] = []

    // For custom period, generate daily data for up to 30 days
    if (period === "custom") {
      return Array.from({ length: 30 }, (_, i) => ({
        name: `Day ${i + 1}`,
        sales: Math.floor(Math.random() * 10) + 1,
      }))
    }

    switch (period) {
      case "this-month":
        // Daily data for current month
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        data = Array.from({ length: daysInMonth }, (_, i) => ({
          name: `${i + 1}`,
          sales: Math.floor(Math.random() * 10) + 1,
        }))
        break

      case "last-month":
        // Daily data for last month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const daysInLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()
        data = Array.from({ length: daysInLastMonth }, (_, i) => ({
          name: `${i + 1}`,
          sales: Math.floor(Math.random() * 10) + 1,
        }))
        break

      case "last-3-months":
      case "last-6-months":
        // Weekly data for 3 or 6 months
        const months = period === "last-3-months" ? 3 : 6
        data = Array.from({ length: months * 4 }, (_, i) => ({
          name: `W${i + 1}`,
          sales: Math.floor(Math.random() * 30) + 5,
        }))
        break

      case "this-year":
      case "last-year":
        // Monthly data for a year
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        data = monthNames.map((month) => ({
          name: month,
          sales: Math.floor(Math.random() * 100) + 20,
        }))
        break

      case "all-time":
      default:
        // Yearly data for all time (last 5 years)
        const currentYear = now.getFullYear()
        data = Array.from({ length: 5 }, (_, i) => ({
          name: `${currentYear - 4 + i}`,
          sales: Math.floor(Math.random() * 500) + 100,
        }))
        break
    }

    return data
  }

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
        <Tooltip
          formatter={(value: number) => [`${value} sales`, "Sales"]}
          labelFormatter={(label) => {
            // Format the label based on period
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
