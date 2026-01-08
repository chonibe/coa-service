"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Calendar, AlertCircle } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
} from "recharts"
import { format } from "date-fns"
import { formatUSD } from "@/lib/utils"

interface AnalyticsData {
  trends: Array<{
    date: string
    payoutAmount: number
    revenueAmount: number
    productCount: number
  }>
  metrics: {
    totalPayouts: number
    totalPayoutAmount: number
    completedPayouts: number
    averagePayoutAmount: number
    payoutVelocity: number
    successRate: number
  }
  trendAnalysis: {
    daily: Array<{
      period: string
      payoutAmount: number
      revenueAmount: number
      productCount: number
      change: number
    }>
    weekly: Array<{
      period: string
      payoutAmount: number
      revenueAmount: number
      productCount: number
      change: number
    }>
    monthly: Array<{
      period: string
      payoutAmount: number
      revenueAmount: number
      productCount: number
      change: number
    }>
  }
  paymentMethodBreakdown: Array<{
    method: string
    count: number
    amount: number
    percentage: number
  }>
}

interface PayoutAnalyticsProps {
  vendorName?: string
  isAdmin?: boolean
  timeRange?: string
  onTimeRangeChange?: (timeRange: string) => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function PayoutAnalytics({
  vendorName,
  isAdmin = false,
  timeRange = "30d",
  onTimeRangeChange
}: PayoutAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedTrendPeriod, setSelectedTrendPeriod] = useState<"daily" | "weekly" | "monthly">("weekly")

  useEffect(() => {
    fetchAnalytics()
  }, [selectedTimeRange, vendorName])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        timeRange: selectedTimeRange,
      })

      if (vendorName) {
        params.set("vendorName", vendorName)
      }

      const response = await fetch(`/api/payouts/analytics?${params}`)
      if (!response.ok) throw new Error("Failed to fetch analytics data")

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err: any) {
      setError(err.message || "Failed to load analytics")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeRangeChange = (newTimeRange: string) => {
    setSelectedTimeRange(newTimeRange)
    onTimeRangeChange?.(newTimeRange)
  }

  const formatTooltipValue = (value: number, name: string) => {
    if (name === "payoutAmount" || name === "revenueAmount") {
      return [formatUSD(value), name === "payoutAmount" ? "Payout Amount" : "Revenue Amount"]
    }
    return [value, "Product Count"]
  }

  const formatTrendTooltip = (value: number, name: string) => {
    if (name === "change") {
      return [`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`, "Change"]
    }
    return formatTooltipValue(value, name)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
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

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payout Analytics</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Comprehensive payout analytics" : "Your payout performance"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(data.metrics.totalPayoutAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.totalPayouts} payouts ({data.metrics.completedPayouts} completed)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(data.metrics.averagePayoutAmount)}</div>
            <p className="text-xs text-muted-foreground">
              Per payout transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {data.metrics.payoutVelocity.toFixed(1)} payouts/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Payout Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Payout Trends</CardTitle>
          <CardDescription>
            Compare revenue generation with payout amounts over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), "MMM dd")}
                />
                <YAxis tickFormatter={(value) => formatUSD(value)} />
                <Tooltip
                  formatter={formatTooltipValue}
                  labelFormatter={(value) => format(new Date(value), "PPP")}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenueAmount"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="payoutAmount"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                  name="Payouts"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                  Performance trends over different time periods
                </CardDescription>
              </div>
              <Select value={selectedTrendPeriod} onValueChange={(value: any) => setSelectedTrendPeriod(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendAnalysis[selectedTrendPeriod]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatUSD(value)} />
                  <Tooltip
                    formatter={formatTrendTooltip}
                    labelFormatter={(value) => value}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="payoutAmount"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Payout Amount"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Distribution of payouts by payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.paymentMethodBreakdown.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize">{method.method.replace('_', ' ')}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatUSD(method.amount)}</div>
                    <div className="text-sm text-muted-foreground">
                      {method.percentage.toFixed(1)}% ({method.count} payouts)
                    </div>
                  </div>
                </div>
              ))}

              <div className="h-32 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.paymentMethodBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {data.paymentMethodBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatUSD(value as number)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>
            Key insights from your payout data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const latestTrend = data.trendAnalysis[selectedTrendPeriod].slice(-1)[0]
              const previousTrend = data.trendAnalysis[selectedTrendPeriod].slice(-2)[0]

              const payoutChange = latestTrend && previousTrend
                ? ((latestTrend.payoutAmount - previousTrend.payoutAmount) / previousTrend.payoutAmount) * 100
                : 0

              return (
                <>
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    {payoutChange >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {payoutChange >= 0 ? '+' : ''}{payoutChange.toFixed(1)}% Change
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Latest {selectedTrendPeriod} payout amount
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium">
                        {data.metrics.payoutVelocity.toFixed(1)} payouts/week
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current payout velocity
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}






