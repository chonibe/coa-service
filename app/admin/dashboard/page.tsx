"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { AlertCircle, ArrowRight, BarChart3, Package, RefreshCw, ShoppingCart, Users } from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock data - in a real app, this would be an API call
      const data = {
        stats: {
          totalOrders: 1248,
          totalRevenue: 124850.75,
          totalProducts: 156,
          totalCustomers: 892,
        },
        recentOrders: [
          { id: "ORD-1234", customer: "John Doe", amount: 125.99, status: "completed", date: "2023-05-01T10:00:00Z" },
          { id: "ORD-1235", customer: "Jane Smith", amount: 89.99, status: "processing", date: "2023-05-01T11:30:00Z" },
          {
            id: "ORD-1236",
            customer: "Bob Johnson",
            amount: 199.99,
            status: "completed",
            date: "2023-05-01T12:15:00Z",
          },
          { id: "ORD-1237", customer: "Alice Brown", amount: 149.99, status: "shipped", date: "2023-05-01T14:20:00Z" },
        ],
        topProducts: [
          { id: "PROD-1", name: "Premium Widget", sales: 124, revenue: 12400 },
          { id: "PROD-2", name: "Deluxe Gadget", sales: 98, revenue: 9800 },
          { id: "PROD-3", name: "Super Tool", sales: 87, revenue: 8700 },
          { id: "PROD-4", name: "Amazing Device", sales: 76, revenue: 7600 },
        ],
      }

      setDashboardData(data)
      setLastRefreshed(new Date())
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err)
      setError(err.message || "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Handle refresh
  const handleRefresh = async () => {
    await fetchDashboardData()
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Last refreshed: {lastRefreshed.toLocaleTimeString()}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData ? formatCurrency(dashboardData.stats.totalRevenue) : "$0.00"}
              </div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">+5 new this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData?.stats.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">+18.2% from last month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent-orders">
          <TabsList>
            <TabsTrigger value="recent-orders">Recent Orders</TabsTrigger>
            <TabsTrigger value="top-products">Top Products</TabsTrigger>
          </TabsList>
          <TabsContent value="recent-orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders from your store</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {dashboardData?.recentOrders.map((order: any) => (
                    <div key={order.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
                      </div>
                      <div className="ml-auto font-medium">{formatCurrency(order.amount)}</div>
                      <div className="ml-4">
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "success"
                              : order.status === "processing"
                                ? "default"
                                : "secondary"
                          }
                          className={
                            order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : order.status === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : ""
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/admin/orders">
                      View All Orders
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="top-products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Your best selling products this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {dashboardData?.topProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} units sold</p>
                      </div>
                      <div className="ml-auto font-medium">{formatCurrency(product.revenue)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/admin/products">
                      View All Products
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  )
}
