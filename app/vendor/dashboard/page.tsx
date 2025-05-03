"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTab = searchParams.get("tab") || "overview"

  const fetchVendorProfile = async () => {
    try {
      const response = await fetch("/api/vendor/profile")
      if (!response.ok) {
        throw new Error("Failed to fetch vendor profile")
      }
      const data = await response.json()
      setVendorName(data.vendor?.vendor_name || "")
      return data.vendor?.vendor_name
    } catch (err) {
      console.error("Error fetching vendor profile:", err)
      setError("Failed to load vendor profile")
      return null
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
      const vendor = await fetchVendorProfile()
      if (vendor) {
        await fetchVendorStats()
      }
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

  const handleTabChange = (value: string) => {
    router.push(`/vendor/dashboard?tab=${value}`)
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
    <div className="space-y-4 p-4 md:p-8 pt-6">
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

          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Sales History</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Sales chart will appear here</p>
                    </div>
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
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Products</CardTitle>
                      <CardDescription>Manage and monitor your product performance</CardDescription>
                    </div>
                    <Button size="sm">Add Product</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="p-4">
                      <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">Product data will appear here</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Your sales performance over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Sales chart will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>Your payment history and upcoming payouts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">Pending Payout</p>
                        <p className="text-sm text-muted-foreground">Next payout date: 1st of next month</p>
                      </div>
                      <p className="font-medium">{formatCurrency(stats?.pendingPayout || 0)}</p>
                    </div>
                    <p className="text-center py-4 text-muted-foreground">No previous payout history available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
