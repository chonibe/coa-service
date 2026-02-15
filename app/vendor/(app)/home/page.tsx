'use client'

import { useEffect, useState, useMemo } from 'react'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { DollarSign, ShoppingCart, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Home Tab — Phase 2.1
//
// API: /api/vendor/profile, /api/vendor/stats?range=30d&compare=true,
//      /api/vendor/sales-analytics?range=30d
// Render: Metric cards (Total Sales, Total Payout, Orders, Avg Order),
//         mini sales chart, recent activity
// Old source: app/vendor/dashboard/page.tsx
// ============================================================================

interface SalesData {
  totalSales: number
  totalRevenue: number
  totalPayout: number
  previousTotalSales?: number
  previousTotalRevenue?: number
  previousTotalPayout?: number
  salesByDate: Array<{ date: string; sales: number; revenue: number }>
  recentActivity: Array<{ id: string; date: string; product_id: string; price: number; quantity: number }>
}

export default function VendorHomePage() {
  const [vendorName, setVendorName] = useState('Artist')
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0, totalRevenue: 0, totalPayout: 0,
    salesByDate: [], recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Fetch profile
      try {
        const profileRes = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (profileRes.ok) {
          const data = await profileRes.json()
          setVendorName(data.vendor?.vendor_name || 'Artist')
        }
      } catch (err) {
        console.error('[VendorHome] Profile fetch error:', err)
      }

      // Fetch stats
      try {
        const statsRes = await fetch('/api/vendor/stats?range=30d&compare=true', {
          cache: 'no-store', credentials: 'include',
        })
        if (statsRes.ok) {
          const stats = await statsRes.json()
          const prev = stats.previous || {}
          setSalesData((p) => ({
            ...p,
            totalSales: stats.totalSales ?? 0,
            totalRevenue: stats.totalRevenue ?? 0,
            totalPayout: stats.totalPayout ?? stats.totalRevenue ?? 0,
            recentActivity: stats.recentActivity || [],
            previousTotalSales: prev.totalSales,
            previousTotalRevenue: prev.totalRevenue,
            previousTotalPayout: prev.totalPayout,
          }))
        }
      } catch (err) {
        console.error('[VendorHome] Stats fetch error:', err)
      }

      // Fetch sales analytics
      try {
        const analyticsRes = await fetch('/api/vendor/sales-analytics?range=30d', {
          cache: 'no-store', credentials: 'include',
        })
        if (analyticsRes.ok) {
          const analytics = await analyticsRes.json()
          setSalesData((p) => ({
            ...p,
            salesByDate: analytics.salesByDate || [],
          }))
        }
      } catch (err) {
        console.error('[VendorHome] Analytics fetch error:', err)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const calcTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesTrend = calcTrend(salesData.totalSales, salesData.previousTotalSales)
  const payoutTrend = calcTrend(salesData.totalPayout, salesData.previousTotalPayout)

  // Mini sparkline (simple bar visualization)
  const maxRevenue = Math.max(...salesData.salesByDate.map((d) => d.revenue), 1)

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-impact-h3 font-heading tracking-tight text-gray-900">
          Welcome back, {vendorName}
        </h1>
        <p className="text-sm text-gray-500 font-body mt-1">
          Here&apos;s your 30-day overview.
        </p>
      </div>

      {/* Metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ContentCard key={i} padding="md">
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-6 bg-gray-100 rounded w-20" />
              </div>
            </ContentCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Sales"
            value={String(salesData.totalSales)}
            icon={<ShoppingCart className="w-4 h-4 text-gray-400" />}
            trend={salesTrend}
          />
          <MetricCard
            label="Total Payout"
            value={formatCurrency(salesData.totalPayout)}
            icon={<DollarSign className="w-4 h-4 text-gray-400" />}
            trend={payoutTrend}
          />
          <MetricCard
            label="Revenue"
            value={formatCurrency(salesData.totalRevenue)}
            icon={<TrendingUp className="w-4 h-4 text-gray-400" />}
            trend={calcTrend(salesData.totalRevenue, salesData.previousTotalRevenue)}
          />
          <MetricCard
            label="Avg Order"
            value={salesData.totalSales > 0 ? formatCurrency(salesData.totalRevenue / salesData.totalSales) : '$0.00'}
            icon={<Package className="w-4 h-4 text-gray-400" />}
            trend={null}
          />
        </div>
      )}

      {/* Mini sales chart */}
      {salesData.salesByDate.length > 0 && (
        <ContentCard
          padding="md"
          header={<ContentCardHeader title="Sales Trend" description="Last 30 days" />}
        >
          <div className="flex items-end gap-0.5 h-24 mt-2">
            {salesData.salesByDate.slice(-30).map((d, i) => (
              <div
                key={i}
                className="flex-1 bg-impact-primary/20 rounded-t-sm hover:bg-impact-primary/40 transition-colors"
                style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                title={`${d.date}: ${formatCurrency(d.revenue)}`}
              />
            ))}
          </div>
        </ContentCard>
      )}

      {/* Recent activity */}
      <ContentCard
        padding="md"
        header={<ContentCardHeader title="Recent Activity" description="Your latest sales" />}
      >
        {!loading && salesData.recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400 font-body">No sales activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {salesData.recentActivity.slice(0, 5).map((sale, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 font-body">
                    {new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 font-body">
                    {sale.quantity} {sale.quantity === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900 font-body">
                  {formatCurrency(sale.price * sale.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </div>
  )
}

// Local MetricCard for app shell style
function MetricCard({
  label, value, icon, trend,
}: {
  label: string
  value: string
  icon: React.ReactNode
  trend: number | null
}) {
  return (
    <ContentCard padding="md">
      <div className="flex items-center justify-between mb-1">
        {icon}
        {trend !== null && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-bold',
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
          )}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{label}</p>
      <p className="text-lg font-bold text-gray-900 font-body mt-0.5">{value}</p>
    </ContentCard>
  )
}
