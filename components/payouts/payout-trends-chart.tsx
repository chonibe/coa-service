"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"

interface PayoutTrendData {
  date: string
  payoutAmount: number
  revenueAmount: number
  forecastAmount?: number
  productCount: number
}

interface PayoutTrendsChartProps {
  vendorName?: string
  isAdmin?: boolean
  timeRange?: "7d" | "30d" | "90d" | "1y" | "all"
}

export function PayoutTrendsChart({ vendorName, isAdmin = false, timeRange = "30d" }: PayoutTrendsChartProps) {
  const [data, setData] = useState<PayoutTrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<string>(timeRange)
  const [chartType, setChartType] = useState<"line" | "bar" | "combined">("combined")

  useEffect(() => {
    fetchTrendData()
  }, [selectedRange, vendorName])

  const fetchTrendData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const url = isAdmin
        ? `/api/payouts/analytics?timeRange=${selectedRange}`
        : `/api/vendor/payouts/analytics?timeRange=${selectedRange}`

      const response = await fetch(url, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch trend data")
      }

      const result = await response.json()
      setData(result.trends || [])
    } catch (err) {
      console.error("Error fetching trend data:", err)
      setError(err instanceof Error ? err.message : "Failed to load trend data")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTrend = () => {
    if (data.length < 2) return { direction: "neutral", percentage: 0 }
    const recent = data.slice(-7).reduce((sum, d) => sum + d.payoutAmount, 0)
    const previous = data.slice(-14, -7).reduce((sum, d) => sum + d.payoutAmount, 0)
    if (previous === 0) return { direction: recent > 0 ? "up" : "neutral", percentage: 0 }
    const percentage = ((recent - previous) / previous) * 100
    return { direction: percentage > 0 ? "up" : percentage < 0 ? "down" : "neutral", percentage: Math.abs(percentage) }
  }

  const trend = calculateTrend()
  const totalPayouts = data.reduce((sum, d) => sum + d.payoutAmount, 0)
  const totalRevenue = data.reduce((sum, d) => sum + d.revenueAmount, 0)
  const avgPayout = data.length > 0 ? totalPayouts / data.length : 0

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (selectedRange === "7d") return format(date, "EEE")
      if (selectedRange === "30d") return format(date, "MMM d")
      if (selectedRange === "90d") return format(date, "MMM")
      return format(date, "MMM yyyy")
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Payout Trends</CardTitle>
          <CardDescription>Analyzing payout patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Payout Trends</CardTitle>
          <CardDescription>Analyzing payout patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Payout Trends</CardTitle>
          <CardDescription>Analyzing payout patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No payout data available for the selected period
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Payout Trends
              {trend.direction !== "neutral" && (
                <div className="flex items-center gap-1 text-sm">
                  {trend.direction === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={trend.direction === "up" ? "text-green-500" : "text-red-500"}>
                    {trend.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </CardTitle>
            <CardDescription>Revenue vs payout comparison with forecasting</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedRange} onValueChange={setSelectedRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">Combined</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
            <div className="text-sm text-muted-foreground">Total Payouts</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{formatUSD(totalPayouts)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
            <div className="text-sm text-muted-foreground">Total Revenue</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{formatUSD(totalRevenue)}</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
            <div className="text-sm text-muted-foreground">Avg Daily Payout</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{formatUSD(avgPayout)}</div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          {chartType === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "payoutAmount") return [formatUSD(value), "Payout"]
                  if (name === "revenueAmount") return [formatUSD(value), "Revenue"]
                  if (name === "forecastAmount") return [formatUSD(value), "Forecast"]
                  return [value, name]
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="payoutAmount"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Payout"
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenueAmount"
                stroke="#6366f1"
                strokeWidth={2}
                name="Revenue"
                dot={{ r: 4 }}
              />
              {data.some((d) => d.forecastAmount) && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="forecastAmount"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                  dot={{ r: 4 }}
                />
              )}
            </LineChart>
          ) : chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "payoutAmount") return [formatUSD(value), "Payout"]
                  if (name === "revenueAmount") return [formatUSD(value), "Revenue"]
                  return [value, name]
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="payoutAmount" fill="#3b82f6" name="Payout" />
              <Bar yAxisId="right" dataKey="revenueAmount" fill="#6366f1" name="Revenue" />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "payoutAmount") return [formatUSD(value), "Payout"]
                  if (name === "revenueAmount") return [formatUSD(value), "Revenue"]
                  if (name === "forecastAmount") return [formatUSD(value), "Forecast"]
                  return [value, name]
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="payoutAmount" fill="#3b82f6" fillOpacity={0.6} name="Payout" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenueAmount"
                stroke="#6366f1"
                strokeWidth={3}
                name="Revenue"
                dot={{ r: 4 }}
              />
              {data.some((d) => d.forecastAmount) && (
                <>
                  <ReferenceLine yAxisId="left" y={0} stroke="#8b5cf6" strokeDasharray="5 5" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="forecastAmount"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Forecast"
                    dot={{ r: 4 }}
                  />
                </>
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

