"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle, Download, RefreshCw, BarChart, TrendingUp, DollarSign, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

// Mock data for the sales report
const generateMockData = () => {
  const today = new Date()
  const dailyData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(today, 29 - i)
    return {
      date: format(date, "yyyy-MM-dd"),
      sales: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10,
    }
  })

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    return {
      month: format(new Date(today.getFullYear(), i, 1), "MMM"),
      sales: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 500) + 100,
    }
  })

  const topProducts = Array.from({ length: 5 }, (_, i) => {
    return {
      id: `PROD-${1000 + i}`,
      name: `Product ${i + 1}`,
      sales: Math.floor(Math.random() * 10000) + 1000,
      quantity: Math.floor(Math.random() * 100) + 10,
    }
  }).sort((a, b) => b.sales - a.sales)

  const topVendors = Array.from({ length: 5 }, (_, i) => {
    return {
      id: `VEND-${1000 + i}`,
      name: `Vendor ${i + 1}`,
      sales: Math.floor(Math.random() * 20000) + 5000,
      products: Math.floor(Math.random() * 20) + 5,
    }
  }).sort((a, b) => b.sales - a.sales)

  return {
    dailyData,
    monthlyData,
    topProducts,
    topVendors,
    summary: {
      totalSales: dailyData.reduce((sum, day) => sum + day.sales, 0),
      totalOrders: dailyData.reduce((sum, day) => sum + day.orders, 0),
      averageOrderValue: Math.floor(
        dailyData.reduce((sum, day) => sum + day.sales, 0) / dailyData.reduce((sum, day) => sum + day.orders, 0),
      ),
    },
  }
}

export default function SalesReportPage() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<string>("30days")
  const [reportData, setReportData] = useState<any>(null)

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch report data
  useEffect(() => {
    if (!mounted) return
    const fetchReportData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // In a real app, you would fetch data from an API
        // For now, we'll use mock data
        setTimeout(() => {
          setReportData(generateMockData())
          setIsLoading(false)
        }, 1000)
      } catch (err: any) {
        console.error("Error fetching report data:", err)
        setError(err.message || "Failed to fetch report data")
        setIsLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange, mounted])

  // Handle refresh
  const handleRefresh = () => {
    if (!mounted) return
    setReportData(null)
    setIsLoading(true)
    setTimeout(() => {
      setReportData(generateMockData())
      setIsLoading(false)
    }, 1000)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Get date range label
  const getDateRangeLabel = () => {
    const today = new Date()

    switch (dateRange) {
      case "30days":
        return `${format(subDays(today, 30), "MMM d, yyyy")} - ${format(today, "MMM d, yyyy")}`
      case "thisMonth":
        return `${format(startOfMonth(today), "MMM d, yyyy")} - ${format(endOfMonth(today), "MMM d, yyyy")}`
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        return `${format(startOfMonth(lastMonth), "MMM d, yyyy")} - ${format(endOfMonth(lastMonth), "MMM d, yyyy")}`
      case "thisYear":
        return `${format(startOfYear(today), "MMM d, yyyy")} - ${format(endOfYear(today), "MMM d, yyyy")}`
      default:
        return "Custom date range"
    }
  }

  // Don't render anything until mounted
  if (!mounted) {
    return null
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Reports</h1>
            <p className="text-muted-foreground mt-2">Analyze your sales performance and trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Date Range: {getDateRangeLabel()}</p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
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
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reportData ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">+20.1% from previous period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.summary.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">+12.5% from previous period</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.summary.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">+2.3% from previous period</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales Trend</CardTitle>
                    <CardDescription>Daily sales performance over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="w-full h-full flex items-center justify-center">
                      <BarChart className="h-16 w-16 text-muted-foreground" />
                      <p className="ml-4 text-muted-foreground">Sales chart visualization would appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Products with the highest sales volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.topProducts.map((product: any, index: number) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{product.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {product.id}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{product.quantity} units</Badge>
                            <span className="font-medium">{formatCurrency(product.sales)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vendors">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Vendors</CardTitle>
                    <CardDescription>Vendors with the highest sales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reportData.topVendors.map((vendor: any, index: number) => (
                        <div key={vendor.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{vendor.name}</p>
                            <p className="text-sm text-muted-foreground">ID: {vendor.id}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{vendor.products} products</Badge>
                            <span className="font-medium">{formatCurrency(vendor.sales)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>
    </div>
  )
}
