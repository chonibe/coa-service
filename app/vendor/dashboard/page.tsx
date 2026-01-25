"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, DollarSign, Package, TrendingUp, ShoppingCart } from "lucide-react"
import { OnboardingAlert } from "./components/onboarding-alert"
import { OnboardingBanner } from "./components/onboarding-banner"
import { ContextualOnboarding } from "../components/contextual-onboarding"
import { VendorSalesChart } from "./components/vendor-sales-chart"
import { useVendorData } from "@/hooks/use-vendor-data"
import { MetricCard } from "@/components/vendor/metric-card"
import { LoadingSkeleton } from "@/components/vendor/loading-skeleton"
import { EmptyState } from "@/components/vendor/empty-state"
import { KeyboardShortcutsManager, defaultShortcuts } from "@/lib/keyboard-shortcuts"
import { TimeRangeSelector, type TimeRange, type DateRange } from "@/components/vendor/time-range-selector"

interface SalesData {
  totalSales: number
  totalRevenue: number
  totalPayout: number
  previousTotalSales?: number
  previousTotalRevenue?: number
  previousTotalPayout?: number
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
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalRevenue: 0,
    totalPayout: 0,
    salesByDate: [],
    salesByProduct: [],
    recentActivity: [],
    currency: "USD",
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

  const fetchSalesData = useMemo(() => async (range: TimeRange, customRange?: DateRange) => {
    const params = new URLSearchParams()
    params.set("range", range)
    params.set("compare", "true")
    if (customRange) {
      params.set("from", customRange.from.toISOString())
      params.set("to", customRange.to.toISOString())
    }

    try {
      setIsLoadingStats(true)
      setStatsError(null)

      const statsResponse = await fetch(`/api/vendor/stats?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to fetch sales data: ${statsResponse.status}`)
      }

      const statsData = await statsResponse.json()
      const previous = statsData.previous || {}

      setSalesData((prev) => ({
        ...prev,
        totalSales: statsData.totalSales ?? 0,
        totalRevenue: statsData.totalRevenue ?? 0,
        totalPayout: statsData.totalPayout ?? statsData.totalRevenue ?? 0,
        salesByDate: statsData.salesByDate || prev.salesByDate || [],
        recentActivity: statsData.recentActivity || [],
        currency: "USD",
        previousTotalSales: previous.totalSales ?? prev.previousTotalSales,
        previousTotalRevenue: previous.totalRevenue ?? prev.previousTotalRevenue,
        previousTotalPayout: previous.totalPayout ?? prev.previousTotalPayout,
      }))
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching sales data:", err)
      setStatsError(err instanceof Error ? err.message : "Failed to load sales data")
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  const fetchAnalytics = useMemo(() => async (range: TimeRange, customRange?: DateRange) => {
    const params = new URLSearchParams()
    params.set("range", range)
    if (customRange) {
      params.set("from", customRange.from.toISOString())
      params.set("to", customRange.to.toISOString())
    }

    try {
      setIsLoadingAnalytics(true)
      setAnalyticsError(null)

      const response = await fetch(`/api/vendor/sales-analytics?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `Failed to fetch analytics data: ${response.status}`)
      }

      const analyticsData = await response.json()
      setSalesData((prev) => ({
        ...prev,
        salesByDate: analyticsData.salesByDate || [],
        salesByProduct: analyticsData.salesByProduct || [],
      }))
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      setAnalyticsError(err instanceof Error ? err.message : "Failed to load analytics data")
    } finally {
      setIsLoadingAnalytics(false)
    }
  }, [])

  useEffect(() => {
    void fetchSalesData(timeRange, dateRange)
    void fetchAnalytics(timeRange, dateRange)
  }, [fetchAnalytics, fetchSalesData, timeRange, dateRange])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate trends (mock data for now - would come from API)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const previousSales = (salesData as any).previousTotalSales ?? salesData.totalSales * 0.9
  const previousRevenue = (salesData as any).previousTotalRevenue ?? salesData.totalRevenue * 0.95
  const previousPayout = (salesData as any).previousTotalPayout ?? salesData.totalPayout * 0.95
  const isLoading = isLoadingStats || isLoadingAnalytics
  const formattedLastUpdated = lastUpdated ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(lastUpdated) : null

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-lg">Welcome back, {vendorName}! Here's what's happening with your business.</p>
            {formattedLastUpdated && <p className="text-xs text-muted-foreground">Last updated {formattedLastUpdated}</p>}
          </div>
          <div className="flex items-center gap-2">
            <TimeRangeSelector
              value={timeRange}
              dateRange={dateRange}
              onChange={(range, customRange) => {
                setTimeRange(range)
                setDateRange(customRange)
              }}
            />
          </div>
        </div>

        {/* Contextual onboarding - floating card */}
        <ContextualOnboarding context="dashboard" />

      {statsError && (
        <Alert variant="destructive" className="border shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Stats issue</AlertTitle>
          <AlertDescription>{statsError}</AlertDescription>
        </Alert>
      )}
      {analyticsError && (
        <Alert variant="destructive" className="border shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analytics issue</AlertTitle>
          <AlertDescription>{analyticsError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton variant="metric" count={3} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
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
                title="Total Payout"
                value={formatCurrency(salesData?.totalPayout || 0)}
                icon={DollarSign}
                trend={{
                  value: calculateTrend(salesData.totalPayout, previousPayout),
                  label: "vs last period",
                  isPositive: salesData.totalPayout >= previousPayout,
                }}
                description="Earnings ready for PayPal transfer"
                variant="elevated"
              />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border shadow-sm">
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
          </div>
      </div>
    </div>
  )
}
