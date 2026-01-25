"use client"

import { useState, useEffect, Suspense } from "react"


import { AlertCircle, Download, BarChart3 } from "lucide-react"

import { Skeleton } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { TimeRangeSelector, type TimeRange, type DateRange } from "@/components/vendor/time-range-selector"
import { LoadingSkeleton } from "@/components/vendor/loading-skeleton"
import { EmptyState } from "@/components/vendor/empty-state"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"



import { ProductPerformance } from "@/components/vendor/product-performance"
import { PayoutTrendsChart } from "@/components/payouts/payout-trends-chart"
import { ProductPerformanceHeatmap } from "@/components/payouts/product-performance-heatmap"
import { PayoutMetricsCards } from "@/components/payouts/payout-metrics-cards"
import { MetricCard } from "@/components/vendor/metric-card"
import { ShoppingCart, DollarSign, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Alert, AlertDescription, AlertTitle, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"]

interface SaleItem {
  id: string
  product_id: string
  title: string
  imageUrl?: string | null
  date: string
  price: number
  currency: string
  quantity?: number
}

export function AnalyticsInsights() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [salesHistory, setSalesHistory] = useState<SaleItem[]>([])
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalPayout: 0,
    currency: "USD",
  })
  const [sortField, setSortField] = useState<keyof SaleItem>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [vendorName, setVendorName] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchAnalyticsData = async (range: TimeRange = timeRange, customRange?: DateRange) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append("range", range)
      if (customRange) {
        params.append("from", customRange.from.toISOString())
        params.append("to", customRange.to.toISOString())
      }

      const response = await fetch(`/api/vendor/sales-analytics?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to fetch analytics: ${response.status}`)
      }

      const data = await response.json()
      setSalesHistory(data.salesHistory || [])
    } catch (err: any) {
      console.error("Error fetching analytics:", err)
      setError(err.message || "Failed to load analytics data")
      toast({
        title: "Error",
        description: err.message || "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
    fetchVendorData()
  }, [])

  const fetchVendorData = async () => {
    try {
      const profileResponse = await fetch("/api/vendor/profile", {
        credentials: "include",
      })
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        setVendorName(profileData.vendor?.vendor_name || null)
      }

      const statsResponse = await fetch("/api/vendor/stats", {
        cache: "no-store",
        credentials: "include",
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setSalesData({
          totalSales: statsData.totalSales ?? 0,
          totalRevenue: statsData.totalRevenue ?? 0,
          totalPayout: statsData.totalPayout ?? statsData.totalRevenue ?? 0,
          currency: statsData.currency || "USD",
        })
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err)
    }
  }

  const handleTimeRangeChange = (range: TimeRange, customRange?: DateRange) => {
    setTimeRange(range)
    if (customRange) {
      setDateRange(customRange)
    } else {
      setDateRange(undefined)
    }
    fetchAnalyticsData(range, customRange)
  }

  const handleExport = () => {
    try {
      const csvContent = [
        ["Date", "Product", "Price", "Currency", "Quantity"].join(","),
        ...salesHistory.map((item) =>
          [
            new Date(item.date).toLocaleDateString(),
            `"${item.title}"`,
            item.price,
            item.currency,
            item.quantity || 1,
          ].join(",")
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `sales-analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: "Sales data exported to CSV",
      })
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "Failed to export sales data",
        variant: "destructive",
      })
    }
  }

  const sortedSalesHistory = [...(salesHistory || [])].sort((a, b) => {
    if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    if (sortField === "price") {
      return sortDirection === "asc" ? a.price - b.price : b.price - a.price
    }
    if (sortField === "title") {
      return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field as keyof SaleItem)
      setSortDirection("asc")
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Professional Insights</h3>
          <p className="text-sm text-muted-foreground">Analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector
            value={timeRange}
            dateRange={dateRange}
            onChange={handleTimeRangeChange}
          />
          {salesHistory.length > 0 && (
            <Button 
              onClick={handleExport} 
              variant="outline" 
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Sales"
              value={salesData.totalSales.toString()}
              icon={ShoppingCart}
              trend={null}
            />
            <MetricCard
              title="Total Revenue"
              value={`${salesData.currency === "USD" ? "$" : "£"}${salesData.totalRevenue.toFixed(2)}`}
              icon={DollarSign}
              trend={null}
            />
            <MetricCard
              title="Total Payout"
              value={`${salesData.currency === "USD" ? "$" : "£"}${salesData.totalPayout.toFixed(2)}`}
              icon={TrendingUp}
              trend={null}
            />
          </div>

          {/* Payout Metrics */}
          {vendorName && <PayoutMetricsCards vendorName={vendorName} />}

          {/* Charts */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {salesHistory.length > 0 ? (
                <>
                  <PayoutTrendsChart vendorName={vendorName || undefined} />
                  <ProductPerformanceHeatmap vendorName={vendorName || undefined} />
                </>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No Analytics Data"
                  description="Start selling to see your analytics and insights"
                />
              )}
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
              <ProductPerformance vendorName={vendorName || undefined} />
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              {salesHistory.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sales History</CardTitle>
                    <CardDescription>Detailed sales records for the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <button
                                onClick={() => handleSort("date")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Date
                                {sortField === "date" && (
                                  <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                onClick={() => handleSort("title")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Product
                                {sortField === "title" && (
                                  <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </button>
                            </TableHead>
                            <TableHead>
                              <button
                                onClick={() => handleSort("price")}
                                className="flex items-center gap-1 hover:text-foreground"
                              >
                                Price
                                {sortField === "price" && (
                                  <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                                )}
                              </button>
                            </TableHead>
                            <TableHead>Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedSalesHistory.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{formatDate(item.date)}</TableCell>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>
                                {item.currency === "USD" ? "$" : "£"}
                                {item.price.toFixed(2)}
                              </TableCell>
                              <TableCell>{item.quantity || 1}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <EmptyState
                  icon={ShoppingCart}
                  title="No Sales Yet"
                  description="Your sales history will appear here once you make your first sale"
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

