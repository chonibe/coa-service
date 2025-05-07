"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowUpRight, Package, PoundSterlingIcon as Pound, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { PeriodFilter } from "./components/period-filter"
import { CustomDateRange } from "./components/custom-date-range"
import { useVendorData } from "@/hooks/use-vendor-data"

export default function VendorDashboard() {
  const {
    stats,
    isLoading,
    error,
    refreshData,
    period,
    setPeriod,
    customDateRange,
    setCustomDateRange,
    applyCustomDateRange,
  } = useVendorData()
  const [activeTab, setActiveTab] = useState("overview")

  // Helper function to format date range for display
  const formatDateRange = () => {
    if (!stats?.dateRange) return "All Time"

    const start = new Date(stats.dateRange.start)
    const end = new Date(stats.dateRange.end)

    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodFilter value={period} onChange={setPeriod} />
          {period === "custom" && (
            <CustomDateRange
              dateRange={customDateRange}
              onDateRangeChange={setCustomDateRange}
              onApply={applyCustomDateRange}
            />
          )}
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {stats?.dateRange && (
        <div className="text-sm text-muted-foreground">
          Showing data for: <span className="font-medium">{formatDateRange()}</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {period === "all-time" ? "All-time total" : `For selected period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {period === "all-time" ? "All-time total" : `For selected period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <Pound className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">£{stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {period === "all-time" ? "All-time total" : `For selected period`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">£{stats?.pendingPayout?.toFixed(2) || "0.00"}</div>
                )}
                <p className="text-xs text-muted-foreground">Available for withdrawal</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  {period === "all-time" ? "All-time sales breakdown" : "Sales breakdown for selected period"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <VendorSalesChart period={period} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest sales and updates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">View detailed analytics for more insights</p>
                        <p className="text-sm text-muted-foreground">
                          Check the Analytics tab for more detailed reports
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("analytics")}>
                          View Analytics
                        </Button>
                      </div>
                    </div>
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
              <CardDescription>Detailed analytics are available in the Analytics section</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Button asChild>
                <a href="/vendor/dashboard/analytics">Go to Analytics</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
