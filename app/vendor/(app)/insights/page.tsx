'use client'

import { useEffect, useMemo, useState } from 'react'
import { SubTabBar, type SubTab, ContentCard } from '@/components/app-shell'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Insights → Sales overview
//
// Presents the same sales data the home spark summarises, but with:
//   - A time-range switcher (7 / 30 / 90 / 365 days)
//   - A quiet bar chart of revenue over the range
//   - A table of the most recent line items in the range
//   - A CSV export of the visible line items
//
// APIs used:
//   - /api/vendor/stats?range=...&compare=true  (totals + recentActivity)
//   - /api/vendor/sales-analytics?range=...     (daily sales time series)
// ============================================================================

type RangeKey = '7d' | '30d' | '90d' | 'ytd'

const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  ytd: 365,
}

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  ytd: 'Year to date',
}

// The sales-analytics API uses "1y" for a rolling year; the stats API uses
// "ytd" for year-to-date. We map between them here so both endpoints line up.
const ANALYTICS_RANGE: Record<RangeKey, string> = {
  '7d': '7d',
  '30d': '30d',
  '90d': '90d',
  ytd: '1y',
}

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Sales', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
]

interface SalesRow {
  id: string
  date: string
  product_id: string
  price: number
  quantity: number
  isPendingFulfillment?: boolean
}

interface InsightsData {
  totalSales: number
  totalRevenue: number
  totalPayout: number
  previousTotalSales?: number
  previousTotalRevenue?: number
  previousTotalPayout?: number
  salesByDate: Array<{ date: string; sales: number; revenue: number }>
  recentActivity: SalesRow[]
}

export default function VendorInsightsPage() {
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<InsightsData>({
    totalSales: 0,
    totalRevenue: 0,
    totalPayout: 0,
    salesByDate: [],
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const statsRes = await fetch(`/api/vendor/stats?range=${range}&compare=true`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (statsRes.ok && !cancelled) {
          const stats = await statsRes.json()
          const prev = stats.previous || {}
          setData((p) => ({
            ...p,
            totalSales: stats.totalSales ?? 0,
            totalRevenue: stats.totalRevenue ?? 0,
            totalPayout: stats.totalPayout ?? stats.totalRevenue ?? 0,
            previousTotalSales: prev.totalSales,
            previousTotalRevenue: prev.totalRevenue,
            previousTotalPayout: prev.totalPayout,
            recentActivity: stats.recentActivity || [],
          }))
        }
      } catch (err) {
        console.error('[Insights] Stats fetch error:', err)
      }

      try {
        const analyticsRes = await fetch(`/api/vendor/sales-analytics?range=${ANALYTICS_RANGE[range]}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (analyticsRes.ok && !cancelled) {
          const analytics = await analyticsRes.json()
          setData((p) => ({
            ...p,
            salesByDate: analytics.salesByDate || [],
          }))
        }
      } catch (err) {
        console.error('[Insights] Analytics fetch error:', err)
      }

      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [range])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const calcTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesTrend = calcTrend(data.totalSales, data.previousTotalSales)
  const revenueTrend = calcTrend(data.totalRevenue, data.previousTotalRevenue)
  const payoutTrend = calcTrend(data.totalPayout, data.previousTotalPayout)

  const maxRevenue = Math.max(...data.salesByDate.map((d) => d.revenue), 1)

  const chartSlice = useMemo(() => {
    const days = RANGE_DAYS[range]
    return data.salesByDate.slice(-days)
  }, [data.salesByDate, range])

  const handleExport = () => {
    const header = ['Date', 'Product ID', 'Quantity', 'Unit price', 'Line total', 'Status']
    const rows = data.recentActivity.map((row) => [
      new Date(row.date).toISOString(),
      row.product_id,
      String(row.quantity),
      row.price.toFixed(2),
      (row.price * row.quantity).toFixed(2),
      row.isPendingFulfillment ? 'Pending' : 'Fulfilled',
    ])
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().slice(0, 10)
    link.download = `sales-${range}-${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-6 md:px-8 md:py-10 max-w-5xl mx-auto space-y-10">
        {/* Header + range switcher */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">
              Sales overview
            </p>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
              {RANGE_LABEL[range]}
            </h1>
          </div>
          <RangeSwitcher value={range} onChange={setRange} />
        </header>

        {/* Metric strip */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#1a1a1a]/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile label="Sales" value={String(data.totalSales)} trend={salesTrend} />
            <MetricTile label="Revenue" value={formatCurrency(data.totalRevenue)} trend={revenueTrend} />
            <MetricTile label="Your payout" value={formatCurrency(data.totalPayout)} trend={payoutTrend} />
          </div>
        )}

        {/* Chart */}
        <section>
          <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
            Revenue over time
          </h2>
          <ContentCard padding="md">
            {loading ? (
              <div className="h-40 bg-[#1a1a1a]/5 rounded animate-pulse" />
            ) : chartSlice.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-body text-sm text-[#1a1a1a]/60">
                  No sales recorded in this window.
                </p>
              </div>
            ) : (
              <div className="flex items-end gap-[2px] h-40">
                {chartSlice.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#1a1a1a]/10 hover:bg-[#1a1a1a]/40 transition-colors"
                    style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                    title={`${d.date}: ${formatCurrency(d.revenue)} (${d.sales} sales)`}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        </section>

        {/* Table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
              Recent line items
            </h2>
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || data.recentActivity.length === 0}
              className={cn(
                'inline-flex items-center gap-1.5 font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4',
                (loading || data.recentActivity.length === 0) && 'opacity-40 cursor-not-allowed no-underline'
              )}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <ContentCard padding="none">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 bg-[#1a1a1a]/5 rounded animate-pulse" />
                ))}
              </div>
            ) : data.recentActivity.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-body text-sm text-[#1a1a1a]/60">
                  Nothing to show here yet. Fulfilled orders will appear in this list.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]/10">
                      <th className="text-left py-3 px-4 font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
                        Product
                      </th>
                      <th className="text-right py-3 px-4 font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
                        Line total
                      </th>
                      <th className="text-right py-3 px-4 font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((row, i) => (
                      <tr
                        key={row.id || i}
                        className="border-b border-[#1a1a1a]/10 last:border-0 hover:bg-[#1a1a1a]/[0.02]"
                      >
                        <td className="py-3 px-4 font-body text-sm text-[#1a1a1a]">
                          {new Date(row.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-body text-sm text-[#1a1a1a]/80 font-mono text-xs">
                          {row.product_id || '—'}
                        </td>
                        <td className="py-3 px-4 font-body text-sm text-[#1a1a1a] text-right">
                          {row.quantity}
                        </td>
                        <td className="py-3 px-4 font-body text-sm text-[#1a1a1a] text-right">
                          {formatCurrency(row.price * row.quantity)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                              row.isPendingFulfillment
                                ? 'border-[#1a1a1a]/20 text-[#1a1a1a]/70'
                                : 'border-[#1a1a1a]/20 text-[#1a1a1a]'
                            )}
                          >
                            {row.isPendingFulfillment ? 'Pending' : 'Fulfilled'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ContentCard>
        </section>
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  trend,
}: {
  label: string
  value: string
  trend: number | null
}) {
  return (
    <ContentCard padding="md">
      <p className="font-body text-[11px] tracking-[0.15em] uppercase text-[#1a1a1a]/50">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <p className="font-heading text-2xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
          {value}
        </p>
        {trend !== null && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-body text-xs',
              trend > 0 ? 'text-[#1a1a1a]' : trend < 0 ? 'text-[#8a5a44]' : 'text-[#1a1a1a]/50'
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
    </ContentCard>
  )
}

function RangeSwitcher({
  value,
  onChange,
}: {
  value: RangeKey
  onChange: (v: RangeKey) => void
}) {
  const options: RangeKey[] = ['7d', '30d', '90d', 'ytd']
  return (
    <div role="tablist" className="inline-flex rounded-full border border-[#1a1a1a]/10 p-0.5 bg-[#FAFAF7]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="tab"
          aria-selected={value === opt}
          onClick={() => onChange(opt)}
          className={cn(
            'px-3 py-1.5 rounded-full font-body text-xs font-medium transition-colors',
            value === opt
              ? 'bg-white text-[#1a1a1a] shadow-sm'
              : 'text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
          )}
        >
          {opt === '7d' ? '7d' : opt === '30d' ? '30d' : opt === '90d' ? '90d' : 'YTD'}
        </button>
      ))}
    </div>
  )
}
