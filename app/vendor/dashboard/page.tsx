"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductTable } from "./components/product-table"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { useSearchParams } from "next/navigation"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { RefreshCw } from "lucide-react"
import { SidebarLayout } from "../components/sidebar-layout"

export default function VendorDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [vendorData, setVendorData] = useState<any>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "overview"

  const fetchVendorData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const response = await fetch("/api/vendor/profile")
      if (response.ok) {
        const data = await response.json()
        setVendorData(data)
      }

      setLastRefreshed(new Date())
    } catch (error) {
      console.error("Error fetching vendor data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchVendorData()
  }, [fetchVendorData])

  // Handle refresh
  const handleRefresh = async () => {
    await fetchVendorData()
  }

  return (
    <SidebarLayout>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col space-y-6 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {vendorData?.name || "Vendor"}</h1>
              <p className="text-muted-foreground">
                Here's an overview of your products and sales performance
                <span className="text-xs ml-2">Last refreshed: {lastRefreshed.toLocaleTimeString()}</span>
              </p>
            </div>
            <div>
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {currentTab === "overview" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${vendorData?.totalRevenue || "0.00"}</div>
                    <p className="text-xs text-muted-foreground">
                      {vendorData?.revenueChange > 0 ? "+" : ""}
                      {vendorData?.revenueChange || "0"}% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vendorData?.productsSold || "0"}</div>
                    <p className="text-xs text-muted-foreground">
                      {vendorData?.salesChange > 0 ? "+" : ""}
                      {vendorData?.salesChange || "0"}% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="m7.5 4.27 9 5.15" />
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                      <path d="m3.3 7 8.7 5 8.7-5" />
                      <path d="M12 22V12" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vendorData?.activeProducts || "0"}</div>
                    <p className="text-xs text-muted-foreground">{vendorData?.newProducts || "0"} new this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${vendorData?.pendingPayout || "0.00"}</div>
                    <p className="text-xs text-muted-foreground">Next payout: {vendorData?.nextPayoutDate || "N/A"}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Your sales performance over time</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <VendorSalesChart />
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates and notifications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(vendorData?.recentActivity || []).length > 0 ? (
                        vendorData.recentActivity.map((activity: any, i: number) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <div>
                              <p className="text-sm">{activity.message}</p>
                              <p className="text-xs text-muted-foreground">{activity.date}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Other tabs content */}

          {currentTab === "overview" && (
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
                <ProductTable vendorName={vendorData?.vendor_name || ""} />
              </CardContent>
            </Card>
          )}
        </div>
      </PullToRefresh>
    </SidebarLayout>
  )
}
