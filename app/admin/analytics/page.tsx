"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription, AlertTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@/components/ui"
import { AlertCircle, TrendingUp, TrendingDown, RefreshCw, Users, ShoppingCart, DollarSign, Package, BarChart3, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { GA4Insights } from "@/components/dashboard/ga4-insights"
import { TimeRangeSelector, type TimeRange, type DateRange } from "@/components/vendor/time-range-selector"
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

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e"]

interface PlatformStats {
  totalRevenue: number
  totalOrders: number
  totalVendors: number
  totalCollectors: number
  totalProducts: number
  revenueGrowth: number
  ordersGrowth: number
  averageOrderValue: number
}

interface VendorAnalytics {
  vendorName: string
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  averageOrderValue: number
}

interface ProductAnalytics {
  productName: string
  vendorName: string
  revenue: number
  units: number
}

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [vendorAnalytics, setVendorAnalytics] = useState<VendorAnalytics[]>([])
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>([])
  const [salesByDate, setSalesByDate] = useState<any[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pagination states
  const [vendorPage, setVendorPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [vendorPageSize, setVendorPageSize] = useState(20)
  const [productPageSize, setProductPageSize] = useState(20)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value)

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(value)

  // Pagination helpers
  const getPaginatedData = <T,>(data: T[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (total: number, pageSize: number) => {
    return Math.ceil(total / pageSize)
  }

  const fetchAnalytics = async (range?: TimeRange, customRange?: DateRange) => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("range", range || timeRange)
      if (customRange || dateRange) {
        const rangeToUse = customRange || dateRange
        if (rangeToUse) {
          params.set("from", rangeToUse.from.toISOString())
          params.set("to", rangeToUse.to.toISOString())
        }
      }

      const response = await fetch(`/api/admin/analytics?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const data = await response.json()

      setPlatformStats(data.platformStats)
      setVendorAnalytics(data.vendorAnalytics || [])
      setProductAnalytics(data.productAnalytics || [])
      setSalesByDate(data.salesByDate || [])
    } catch (err) {
      console.error("Error fetching analytics:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const handleTimeRangeChange = (range: TimeRange, customRange?: DateRange) => {
    setTimeRange(range)
    setDateRange(customRange)
    fetchAnalytics(range, customRange)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics(timeRange, dateRange)
    setIsRefreshing(false)
  }

  const exportData = () => {
    // TODO: Implement CSV export
    console.log("Export data functionality to be implemented")
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights across all vendors and sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector
            value={timeRange}
            onChange={handleTimeRangeChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="ga4">GA4 Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : platformStats ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(platformStats.totalRevenue)}
                icon={DollarSign}
                trend={`${platformStats.revenueGrowth > 0 ? '+' : ''}${platformStats.revenueGrowth.toFixed(1)}%`}
                trendUp={platformStats.revenueGrowth > 0}
              />
              <MetricCard
                title="Total Orders"
                value={formatNumber(platformStats.totalOrders)}
                icon={ShoppingCart}
                trend={`${platformStats.ordersGrowth > 0 ? '+' : ''}${platformStats.ordersGrowth.toFixed(1)}%`}
                trendUp={platformStats.ordersGrowth > 0}
              />
              <MetricCard
                title="Active Vendors"
                value={formatNumber(platformStats.totalVendors)}
                icon={Users}
              />
              <MetricCard
                title="Total Collectors"
                value={formatNumber(platformStats.totalCollectors)}
                icon={Users}
              />
            </div>
          ) : null}

          {/* Sales Trends Chart */}
          {!isLoading && salesByDate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
                <CardDescription>Revenue and order volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sales"
                      stroke="#6366f1"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Top Vendors Preview */}
          {!isLoading && vendorAnalytics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Vendors</CardTitle>
                <CardDescription>By revenue in selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vendorAnalytics.slice(0, 5).map((vendor, index) => (
                    <div key={vendor.vendorName} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{vendor.vendorName}</p>
                          <p className="text-sm text-muted-foreground">
                            {vendor.totalOrders} orders • {vendor.totalProducts} products
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(vendor.totalRevenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(vendor.averageOrderValue)} avg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Vendor Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendor Revenue Distribution</CardTitle>
                  <CardDescription>Total revenue by vendor</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={vendorAnalytics.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vendorName" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalRevenue" fill="#3b82f6" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Vendor Details Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Vendors Performance</CardTitle>
                      <CardDescription>Detailed breakdown of vendor metrics</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={vendorPageSize.toString()}
                        onValueChange={(value) => {
                          setVendorPageSize(Number(value))
                          setVendorPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="20">20 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                          <SelectItem value="100">100 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">#</th>
                          <th className="text-left p-2">Vendor</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">Orders</th>
                          <th className="text-right p-2">Products</th>
                          <th className="text-right p-2">Avg Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedData(vendorAnalytics, vendorPage, vendorPageSize).map((vendor, index) => {
                          const globalIndex = (vendorPage - 1) * vendorPageSize + index + 1
                          return (
                            <tr key={vendor.vendorName} className="border-b hover:bg-muted/50">
                              <td className="p-2 text-muted-foreground">{globalIndex}</td>
                              <td className="p-2 font-medium">{vendor.vendorName}</td>
                              <td className="text-right p-2">{formatCurrency(vendor.totalRevenue)}</td>
                              <td className="text-right p-2">{vendor.totalOrders}</td>
                              <td className="text-right p-2">{vendor.totalProducts}</td>
                              <td className="text-right p-2">{formatCurrency(vendor.averageOrderValue)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vendor Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {(vendorPage - 1) * vendorPageSize + 1} to{" "}
                      {Math.min(vendorPage * vendorPageSize, vendorAnalytics.length)} of{" "}
                      {vendorAnalytics.length} vendors
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendorPage((p) => Math.max(1, p - 1))}
                        disabled={vendorPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        Page {vendorPage} of {getTotalPages(vendorAnalytics.length, vendorPageSize)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendorPage((p) => p + 1)}
                        disabled={vendorPage >= getTotalPages(vendorAnalytics.length, vendorPageSize)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-96 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Products</CardTitle>
                    <CardDescription>Best selling products across all vendors</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={productPageSize.toString()}
                      onValueChange={(value) => {
                        setProductPageSize(Number(value))
                        setProductPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 / page</SelectItem>
                        <SelectItem value="20">20 / page</SelectItem>
                        <SelectItem value="50">50 / page</SelectItem>
                        <SelectItem value="100">100 / page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">#</th>
                        <th className="text-left p-2">Product</th>
                        <th className="text-left p-2">Vendor</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Units Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData(productAnalytics, productPage, productPageSize).map((product, index) => {
                        const globalIndex = (productPage - 1) * productPageSize + index + 1
                        return (
                          <tr key={`${product.productName}-${index}`} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-muted-foreground">{globalIndex}</td>
                            <td className="p-2 font-medium">{product.productName}</td>
                            <td className="p-2 text-muted-foreground">{product.vendorName}</td>
                            <td className="text-right p-2">{formatCurrency(product.revenue)}</td>
                            <td className="text-right p-2">{product.units}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Product Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(productPage - 1) * productPageSize + 1} to{" "}
                    {Math.min(productPage * productPageSize, productAnalytics.length)} of{" "}
                    {productAnalytics.length} products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                      disabled={productPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Page {productPage} of {getTotalPages(productAnalytics.length, productPageSize)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductPage((p) => p + 1)}
                      disabled={productPage >= getTotalPages(productAnalytics.length, productPageSize)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GA4 Insights Tab */}
        <TabsContent value="ga4" className="space-y-6">
          <GA4Insights refreshInterval={30} showRealtime={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp
}: {
  title: string
  value: string
  icon: any
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        {trend && (
          <div className="flex items-center mt-4">
            {trendUp ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
            <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
