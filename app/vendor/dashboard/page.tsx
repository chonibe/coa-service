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

interface SalesData {
  totalSales: number
  totalRevenue: number
  salesByDate: Array<{
    date: string
    sales: number
    revenue: number
  }>
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function VendorDashboardPage() {
  const [vendorName, setVendorName] = useState<string>("Vendor")
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalRevenue: 0,
    salesByDate: []
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
        const response = await fetch("/api/vendor/stats")
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to fetch sales data")
        }
        const data = await response.json()
        console.log("Fetched sales data:", data)
        setSalesData(data)
      } catch (err) {
        console.error("Error fetching sales data:", err)
        setError(err instanceof Error ? err.message : "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your vendor dashboard</p>
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
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorSalesChart vendorName={vendorName} />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Sales Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : salesData?.salesByDate?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No sales activity yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {salesData?.salesByDate?.slice(-5).reverse().map((sale, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {new Date(sale.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.sales} {sale.sales === 1 ? "sale" : "sales"}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          {formatCurrency(sale.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed analytics for your products</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Visit the Analytics page for detailed insights</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
