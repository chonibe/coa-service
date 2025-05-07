"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import { Period } from "./period-selector"

interface SalesData {
  date: string
  sales: number
  revenue: number
}

interface SalesChartProps {
  period: Period
}

export function SalesChart({ period }: SalesChartProps) {
  const [data, setData] = useState<SalesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/vendor/stats/sales?period=${period}`)
        if (!response.ok) {
          throw new Error("Failed to fetch sales data")
        }
        const salesData = await response.json()
        setData(salesData.salesByDate)
        setTotalSales(salesData.totalSales || 0)
        setTotalRevenue(salesData.totalRevenue || 0)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  // Format the date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
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
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-muted-foreground">{error.message}</div>
  }

  const chartData = {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label: "Sales",
        data: data.map((item) => item.sales),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
      {
        label: "Revenue",
        data: data.map((item) => item.revenue),
        borderColor: "rgb(255, 99, 132)",
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Sales Overview",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="bg-muted p-4 rounded-lg text-center flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sales</h3>
            <p className="text-2xl font-bold">{totalSales}</p>
          </div>
          <div className="bg-muted p-4 rounded-lg text-center flex-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sales data available. Once you make your first sale, data will appear here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 12 }}
                label={{ value: "Items Sold", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                label={{ value: "Revenue ($)", angle: 90, position: "insideRight", style: { textAnchor: "middle" } }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                  return [value, "Items Sold"]
                }}
                labelFormatter={(label) => formatDate(label)}
              />
              <Legend />
              <Bar dataKey="sales" name="Items Sold" fill="#8884d8" yAxisId="left" />
              <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" yAxisId="right" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
