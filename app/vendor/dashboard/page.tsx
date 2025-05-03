"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductTable } from "./components/product-table"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { PullToRefresh } from "@/components/pull-to-refresh"

interface VendorStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  pendingPayout: number
}

export default function VendorDashboard() {
  const [vendorName, setVendorName] = useState<string>("")
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch("/api/vendor/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch vendor profile")
      }
      const data = await response.json()
      setVendorName(data.vendor_name || "")
    } catch (err) {
      console.error("Error fetching vendor profile:", err)
      setError("Failed to load vendor profile")
    }
  }

  const fetchVendorStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/vendor/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch vendor stats")
      }
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching vendor stats:", err)
      setError("Failed to load vendor statistics")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await fetchVendorProfile()
      await fetchVendorStats()
    }
    loadData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchVendorProfile()
      await fetchVendorStats()
      toast({
        title: "Dashboard Refreshed",
        description: "Your dashboard data has been updated.",
      })
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "There was a problem refreshing your data.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only md:not-sr-only md:inline-block text-sm">Refresh</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Try Again
              </button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                  <p className="text-xs text-muted-foreground">Products in your catalog</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
                  <p className="text-xs text-muted-foreground">Items sold with certificates</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">From certified items</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayout || 0)}</div>
                  <p className="text-xs text-muted-foreground">Based on your payout settings</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Sales History</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                      <VendorSalesChart vendorName={vendorName} onRefresh={handleRefresh} />
                    </CardContent>
                  </Card>
                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your recent sales and certifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-8">
                        {stats?.totalSales ? (
                          <>
                            <div className="flex items-center">
                              <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {stats.totalSales} items sold with certificates
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Total revenue: {formatCurrency(stats.totalRevenue)}
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No recent activity to display</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="products" className="space-y-4">
                <ProductTable vendorName={vendorName} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PullToRefresh>
  )
}
