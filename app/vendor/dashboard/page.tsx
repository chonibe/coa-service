"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowUpRight, BarChart, DollarSign, Package, Inbox, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [salesData, setSalesData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch vendor stats
      const statsResponse = await fetch("/api/vendor/stats")
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch vendor stats: ${statsResponse.status}`)
      }
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Fetch sales data
      const salesResponse = await fetch("/api/vendor/sales")
      if (!salesResponse.ok) {
        console.warn("Failed to fetch sales data, using empty array")
        setSalesData([])
      } else {
        const salesResult = await salesResponse.json()
        setSalesData(salesResult.sales || [])
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")

      // Set default stats to prevent UI errors
      setStats({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        pendingPayout: 0,
        revenueGrowth: 0,
        salesGrowth: 0,
        newProducts: 0,
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    toast({
      title: "Dashboard Refreshed",
      description: "The latest data has been loaded.",
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your vendor dashboard</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/vendor/dashboard/analytics">View Analytics</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">+{stats?.revenueGrowth || 0}% from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">+{stats?.salesGrowth || 0}% from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats?.pendingPayout?.toFixed(2) || "0.00"}</div>
                <div className="flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  <p className="text-xs text-green-500">Next payout soon</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.newProducts || 0} new this month</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Your most recent sales activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
              </div>
            ) : salesData.length > 0 ? (
              <div className="space-y-4">
                {salesData.slice(0, 3).map((sale, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{sale.product}</p>
                      <p className="text-sm text-muted-foreground">{new Date(sale.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${sale.amount}</p>
                      <p className="text-xs text-muted-foreground">{sale.customer}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground mb-1">No sales data available</p>
                <p className="text-xs text-muted-foreground">Sales will appear here when processed</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/vendor/dashboard/products">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Products
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/vendor/dashboard/payouts">
                  <DollarSign className="mr-2 h-4 w-4" />
                  View Payouts
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/vendor/dashboard/analytics">
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics & Reports
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/vendor/dashboard/settings">
                  <BarChart className="mr-2 h-4 w-4" />
                  Payout Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
