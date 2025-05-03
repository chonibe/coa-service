"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowUpRight, BarChart, DollarSign, Package, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { OnboardingAlert } from "./components/onboarding-alert"

export default function VendorDashboard() {
  const [stats, setStats] = useState<any>(null)
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
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
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
      <OnboardingAlert />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your vendor dashboard</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">${stats?.totalRevenue?.toFixed(2) || "0.00"}</div>
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
              <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>You have {stats?.totalProducts || 0} active products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </div>
              <Button asChild>
                <Link href="/vendor/dashboard/products">
                  <Package className="mr-2 h-4 w-4" />
                  View Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>View detailed sales analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
              <Button asChild>
                <Link href="/vendor/dashboard/analytics">
                  <BarChart className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
