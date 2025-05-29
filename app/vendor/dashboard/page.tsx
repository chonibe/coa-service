"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react"
import { OnboardingAlert } from "./components/onboarding-alert"
import { OnboardingBanner } from "./components/onboarding-banner"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { useVendorData } from "@/hooks/use-vendor-data"
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts"

interface SalesData {
  totalSales: number
  totalRevenue: number
  totalPayout: number
  salesByDate: Array<{
    date: string
    sales: number
    revenue: number
  }>
  salesByProduct: Array<{
    product_id: string
    sales: number
    revenue: number
  }>
  recentActivity?: Array<{
    id: string
    date: string
    product_id: string
    price: number
    quantity: number
  }>
}

export default function VendorDashboardPage() {
  const [vendorName, setVendorName] = useState<string>("Vendor")
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalRevenue: 0,
    totalPayout: 0,
    salesByDate: [],
    salesByProduct: [],
    recentActivity: []
  })

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setVendorName(data.vendor?.vendor_name || "Vendor")
          setOnboardingCompleted(data.vendor?.onboarding_completed || false)
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
      }
    }

    fetchVendorProfile()
  }, [])

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true)
        const [statsResponse, analyticsResponse] = await Promise.all([
          fetch("/api/vendor/stats"),
          fetch("/api/vendor/sales-analytics")
        ])

        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to fetch sales data")
        }

        if (!analyticsResponse.ok) {
          const errorData = await analyticsResponse.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to fetch analytics data")
        }

        const statsData = await statsResponse.json()
        const analyticsData = await analyticsResponse.json()

        // Calculate total sales and revenue from analytics data
        const totalSales = analyticsData.salesByProduct.reduce((total: number, product: any) => total + product.sales, 0)
        const totalRevenue = analyticsData.salesByProduct.reduce((total: number, product: any) => total + product.revenue, 0)

        // Calculate total payout amount
        const totalPayout = analyticsData.salesByProduct.reduce((total: number, product: any) => {
          const payoutPercentage = product.payout_percentage || 0
          return total + (product.revenue * (payoutPercentage / 100))
        }, 0)

        // Create recent activity from sales history
        const recentActivity = analyticsData.salesHistory?.map((sale: any) => ({
          id: sale.id,
          date: sale.date,
          product_id: sale.product_id,
          price: sale.price,
          quantity: sale.quantity
        })) || []

        setSalesData({
          totalSales,
          totalRevenue,
          totalPayout,
          salesByDate: analyticsData.salesByDate || [],
          salesByProduct: analyticsData.salesByProduct || [],
          recentActivity
        })
      } catch (err) {
        console.error("Error fetching sales data:", err)
        setError(err instanceof Error ? err.message : "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {vendorName}</p>
      </div>

      {!onboardingCompleted && <OnboardingBanner vendorName={vendorName} />}

      <OnboardingAlert />

      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="text-2xl font-bold">{salesData?.totalSales || "0"}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? <Skeleton className="h-4 w-[160px]" /> : "Total number of sales"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(salesData?.totalRevenue || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? <Skeleton className="h-4 w-[160px]" /> : "Total revenue generated"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payout</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-[100px]" />
                ) : (
                  <div className="text-2xl font-bold">{formatCurrency(salesData?.totalPayout || 0)}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {isLoading ? <Skeleton className="h-4 w-[160px]" /> : "Total payout amount"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest sales and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : !salesData?.recentActivity || salesData.recentActivity.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No sales activity yet
                </div>
              ) : (
                <div className="space-y-4">
                  {salesData.recentActivity.map((sale, index) => {
                    const saleDate = new Date(sale.date)
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {saleDate.toLocaleDateString("en-GB", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.quantity} {sale.quantity === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(sale.price * sale.quantity)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Detailed analytics for your products</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[300px] w-full" />
                </div>
              ) : salesData?.salesByDate && salesData.salesByDate.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData.salesByDate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "Revenue") {
                              return [formatCurrency(value as number), "Revenue"]
                            }
                            return [value, "Sales"]
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No analytics data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
