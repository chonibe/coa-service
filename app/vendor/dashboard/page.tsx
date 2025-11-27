"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react"
import { OnboardingAlert } from "./components/onboarding-alert"
import { OnboardingBanner } from "./components/onboarding-banner"
import { ContextualOnboarding } from "../components/contextual-onboarding"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { useVendorData } from "@/hooks/use-vendor-data"
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from "recharts"
import { MetricCard } from "@/components/vendor/metric-card"
import { LoadingSkeleton } from "@/components/vendor/loading-skeleton"
import { EmptyState } from "@/components/vendor/empty-state"
import { ProductPerformance } from "@/components/vendor/product-performance"
import { KeyboardShortcutsManager, defaultShortcuts } from "@/lib/keyboard-shortcuts"

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
    productId: string
    title: string
    imageUrl?: string | null
    sales: number
    revenue: number
    payoutType: "percentage" | "flat"
    payoutAmount: number
  }>
  recentActivity?: Array<{
    id: string
    date: string
    product_id: string
    price: number
    quantity: number
  }>
  currency: string
}

export default function VendorDashboardPage() {
  const router = useRouter()
  const shortcutsManagerRef = useRef<KeyboardShortcutsManager | null>(null)
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
    recentActivity: [],
    currency: "GBP",
  })

  // Setup keyboard shortcuts
  useEffect(() => {
    const manager = new KeyboardShortcutsManager()
    shortcutsManagerRef.current = manager

    // Register default shortcuts
    defaultShortcuts.forEach((shortcut) => {
      manager.register({
        ...shortcut,
        handler: () => {
          switch (shortcut.action) {
            case "dashboard":
              router.push("/vendor/dashboard")
              break
            case "products":
              router.push("/vendor/dashboard/products")
              break
            case "analytics":
              router.push("/vendor/dashboard/analytics")
              break
            case "payouts":
              router.push("/vendor/dashboard/payouts")
              break
            case "benefits":
              router.push("/vendor/dashboard/benefits")
              break
            case "messages":
              router.push("/vendor/dashboard/messages")
              break
            case "settings":
              router.push("/vendor/dashboard/settings")
              break
            case "search":
              // Focus search if available, or show command palette
              const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
              if (searchInput) {
                searchInput.focus()
              }
              break
          }
        },
      })
    })

    return () => {
      manager.destroy()
    }
  }, [router])

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setVendorName(data.vendor?.vendor_name || "Vendor")
          const completed = data.vendor?.onboarding_completed || false
          setOnboardingCompleted(completed)
          // Don't redirect - allow access to dashboard with contextual onboarding
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
      }
    }

    fetchVendorProfile()
  }, [router])

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setIsLoading(true)
        const [statsResponse, analyticsResponse] = await Promise.all([
          fetch("/api/vendor/stats", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/vendor/sales-analytics", {
            cache: "no-store",
            credentials: "include",
          })
        ])

        if (!statsResponse.ok) {
          const errorData = await statsResponse.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.message || `Failed to fetch sales data: ${statsResponse.status}`)
        }

        if (!analyticsResponse.ok) {
          const errorData = await analyticsResponse.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.message || `Failed to fetch analytics data: ${analyticsResponse.status}`)
        }

        const statsData = await statsResponse.json()
        const analyticsData = await analyticsResponse.json()

        const currency = statsData.currency || "GBP"

        setSalesData({
          totalSales: statsData.totalSales ?? 0,
          totalRevenue: statsData.totalRevenue ?? 0,
          totalPayout: statsData.totalPayout ?? statsData.totalRevenue ?? 0,
          salesByDate: analyticsData.salesByDate || [],
          salesByProduct: analyticsData.salesByProduct || [],
          recentActivity: statsData.recentActivity || [],
          currency,
        })
      } catch (err) {
        console.error("Error fetching sales data:", err)
        setError(err instanceof Error ? err.message : "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchSalesData()
  }, [])

  // Format currency
  const formatCurrency = (amount: number, currency?: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || salesData.currency || "GBP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate trends (mock data for now - would come from API)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  // Mock previous period data (in real app, fetch from API)
  const previousSales = salesData.totalSales * 0.9 // 10% less for demo
  const previousRevenue = salesData.totalRevenue * 0.95
  const previousPayout = salesData.totalPayout * 0.95

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-lg">Welcome back, {vendorName}! Here's what's happening with your business.</p>
          </div>
        </div>

        {/* Contextual onboarding - floating card */}
        <ContextualOnboarding context="settings" />

      {error ? (
        <Alert variant="destructive" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {isLoading ? (
            <LoadingSkeleton variant="metric" count={3} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Total Sales"
                value={salesData?.totalSales || 0}
                icon={ShoppingCart}
                trend={{
                  value: calculateTrend(salesData.totalSales, previousSales),
                  label: "vs last period",
                  isPositive: salesData.totalSales >= previousSales,
                }}
                description="Orders you've received"
                variant="elevated"
              />

              <MetricCard
                title="Total Revenue"
                value={formatCurrency(salesData?.totalRevenue || 0, salesData.currency)}
                icon={DollarSign}
                trend={{
                  value: calculateTrend(salesData.totalRevenue, previousRevenue),
                  label: "vs last period",
                  isPositive: salesData.totalRevenue >= previousRevenue,
                }}
                description="Total sales you've made"
                variant="elevated"
              />

              <MetricCard
                title="Total Payout"
                value={formatCurrency(salesData?.totalPayout || 0, salesData.currency)}
                icon={DollarSign}
                trend={{
                  value: calculateTrend(salesData.totalPayout, previousPayout),
                  label: "vs last period",
                  isPositive: salesData.totalPayout >= previousPayout,
                }}
                description="What you've earned so far"
                variant="elevated"
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest sales and what's happening</CardDescription>
              </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : !salesData?.recentActivity || salesData.recentActivity.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No sales activity yet"
                  description="Once you start making sales, they'll show up here so you can see what's happening in real-time."
                />
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

            {/* Product Performance */}
            <ProductPerformance
              products={salesData.salesByProduct?.map((p) => ({
                productId: p.productId,
                title: p.title,
                imageUrl: p.imageUrl,
                sales: p.sales,
                revenue: p.revenue,
              })) || []}
              isLoading={isLoading}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Your Sales Performance</CardTitle>
              <CardDescription>See how your products are performing and track your growth</CardDescription>
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
                        <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                        <YAxis yAxisId="right" orientation="right" stroke="#6366f1" />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "Revenue") {
                              return [formatCurrency(value as number), "Revenue"]
                            }
                            return [value, "Sales"]
                          }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#3b82f6" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#6366f1" />
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
