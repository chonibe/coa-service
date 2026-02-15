'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Insights Overview — Phase 2.10
//
// API: /api/vendor/stats?range=30d&compare=true, /api/vendors/balance
// Wire: Replace "—" metric values with real numbers
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
]

interface InsightsData {
  totalSales: number
  totalRevenue: number
  pendingPayout: number
  collectors: number
  previousTotalSales?: number
  previousTotalRevenue?: number
  salesByDate: Array<{ date: string; sales: number; revenue: number }>
}

export default function VendorInsightsPage() {
  const [data, setData] = useState<InsightsData>({
    totalSales: 0, totalRevenue: 0, pendingPayout: 0, collectors: 0,
    salesByDate: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInsights() {
      try {
        // Fetch stats with comparison
        const statsRes = await fetch('/api/vendor/stats?range=30d&compare=true', {
          cache: 'no-store', credentials: 'include',
        })
        if (statsRes.ok) {
          const stats = await statsRes.json()
          const prev = stats.previous || {}
          setData((p) => ({
            ...p,
            totalSales: stats.totalSales ?? 0,
            totalRevenue: stats.totalRevenue ?? 0,
            collectors: stats.totalCollectors ?? stats.collectorCount ?? 0,
            previousTotalSales: prev.totalSales,
            previousTotalRevenue: prev.totalRevenue,
            salesByDate: stats.salesByDate || [],
          }))
        }
      } catch (err) {
        console.error('[Insights] Stats fetch error:', err)
      }

      try {
        // Fetch balance for pending payout
        const balRes = await fetch('/api/vendors/balance', { credentials: 'include' })
        if (balRes.ok) {
          const balJson = await balRes.json()
          setData((p) => ({
            ...p,
            pendingPayout: balJson.available || balJson.balance?.available || 0,
          }))
        }
      } catch (err) {
        console.error('[Insights] Balance fetch error:', err)
      }

      setLoading(false)
    }
    fetchInsights()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const calcTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesTrend = calcTrend(data.totalSales, data.previousTotalSales)
  const revenueTrend = calcTrend(data.totalRevenue, data.previousTotalRevenue)

  // Mini sparkline
  const maxRevenue = Math.max(...data.salesByDate.map((d) => d.revenue), 1)

  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Key metrics */}
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
            <InsightMetric
              label="Total Sales"
              value={String(data.totalSales)}
              trend={salesTrend}
            />
            <InsightMetric
              label="Revenue"
              value={formatCurrency(data.totalRevenue)}
              trend={revenueTrend}
            />
            <InsightMetric
              label="Pending Payout"
              value={formatCurrency(data.pendingPayout)}
              trend={null}
            />
            <InsightMetric
              label="Collectors"
              value={String(data.collectors)}
              trend={null}
            />
          </div>
        )}

        {/* Sales chart */}
        {data.salesByDate.length > 0 && (
          <ContentCard
            padding="md"
            header={<ContentCardHeader title="Sales Over Time" description="Last 30 days" />}
          >
            <div className="flex items-end gap-0.5 h-32 mt-2">
              {data.salesByDate.slice(-30).map((d, i) => (
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
      </div>
    </div>
  )
}

function InsightMetric({
  label, value, trend,
}: {
  label: string
  value: string
  trend: number | null
}) {
  return (
    <ContentCard padding="md">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{label}</p>
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
      <p className="text-xl font-semibold text-gray-900 font-body">{value}</p>
    </ContentCard>
  )
}
