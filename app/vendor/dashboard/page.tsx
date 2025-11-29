"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { BankingDashboard } from "./components/banking-dashboard"

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

      <div className="space-y-6">
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

          <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Credit Banking</CardTitle>
              <CardDescription>Manage your credits and unlock free perks</CardDescription>
            </CardHeader>
            <CardContent>
              <BankingSection vendorName={vendorName} />
            </CardContent>
          </Card>
          </div>
      </div>
    </div>
  )
}

// Banking section component
function BankingSection({ vendorName }: { vendorName: string }) {
  const [collectorIdentifier, setCollectorIdentifier] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCollectorIdentifier = async () => {
      const requestId = `frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[${requestId}] [BankingSection] Starting to fetch collector identifier`, {
        vendorName,
        url: "/api/banking/collector-identifier",
      });

      try {
        const startTime = Date.now();
        const response = await fetch("/api/banking/collector-identifier", {
          credentials: "include",
        });

        const duration = Date.now() - startTime;
        console.log(`[${requestId}] [BankingSection] Response received:`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          duration: `${duration}ms`,
          headers: Object.fromEntries(response.headers.entries()),
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`[${requestId}] [BankingSection] Response data:`, {
            success: data.success,
            collectorIdentifier: data.collectorIdentifier ? data.collectorIdentifier.substring(0, 20) + '...' : null,
            accountType: data.accountType,
            vendorId: data.vendorId,
            requestId: data.requestId,
            error: data.error,
          });

          if (data.success) {
            console.log(`[${requestId}] [BankingSection] Setting collector identifier:`, {
              collectorIdentifier: data.collectorIdentifier.substring(0, 20) + '...',
            });
            setCollectorIdentifier(data.collectorIdentifier);
          } else {
            console.error(`[${requestId}] [BankingSection] Response not successful:`, {
              error: data.error,
              details: data,
            });
          }
        } else {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { raw: errorText };
          }

          console.error(`[${requestId}] [BankingSection] Response not OK:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
        }
      } catch (error: any) {
        console.error(`[${requestId}] [BankingSection] Fetch error:`, {
          error: error.message,
          stack: error.stack,
          name: error.name,
        });
      } finally {
        setIsLoading(false);
        console.log(`[${requestId}] [BankingSection] Loading complete`);
      }
    };
    fetchCollectorIdentifier();
  }, [vendorName])

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!collectorIdentifier) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Unable to load banking information</p>
      </div>
    )
  }

  return <BankingDashboard collectorIdentifier={collectorIdentifier} />
}
