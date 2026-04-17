'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ContentCard } from '@/components/app-shell'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Home — editorial overview
//
// Information hierarchy:
//   1. Greeting
//   2. Pending payout hero (the question every artist logs in to answer)
//   3. Metric strip (sales / revenue / avg order over selected range)
//   4. Sales spark (quiet bar chart for the range)
//   5. Recent activity (last five line items)
//
// APIs consumed:
//   - /api/vendor/profile          (vendor_name, onboarding_completed)
//   - /api/vendor/stats?range=...  (totals + comparison + recentActivity)
//   - /api/vendors/balance         (available / pending / held balance)
//   - /api/vendor/sales-analytics  (salesByDate for sparkline)
// ============================================================================

type RangeKey = '7d' | '30d' | '90d'

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

interface BalanceData {
  available: number
  pending: number
  held: number
}

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
}

export default function VendorHomePage() {
  const router = useRouter()
  const [vendorName, setVendorName] = useState<string>('')
  const [firstName, setFirstName] = useState<string>('')
  const [range, setRange] = useState<RangeKey>('30d')
  const [salesData, setSalesData] = useState<SalesData>({
    totalSales: 0,
    totalRevenue: 0,
    totalPayout: 0,
    salesByDate: [],
    recentActivity: [],
  })
  const [balance, setBalance] = useState<BalanceData>({ available: 0, pending: 0, held: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingBalance, setLoadingBalance] = useState(true)

  // Profile bootstrap — also guards first-time artists through /vendor/welcome.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vendor/profile', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        const vendor = data.vendor
        if (vendor && vendor.is_admin !== true && vendor.onboarding_completed === false) {
          router.replace('/vendor/welcome')
          return
        }
        const name: string = vendor?.vendor_name || 'Artist'
        setVendorName(name)
        setFirstName((vendor?.contact_name || name).split(' ')[0] || name)
      } catch (err) {
        console.error('[VendorHome] Profile fetch error:', err)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router])

  // Stats + sparkline — refetch when range changes.
  useEffect(() => {
    let cancelled = false
    setLoadingStats(true)
    ;(async () => {
      try {
        const statsRes = await fetch(`/api/vendor/stats?range=${range}&compare=true`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (statsRes.ok && !cancelled) {
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

      try {
        const analyticsRes = await fetch(`/api/vendor/sales-analytics?range=${range}`, {
          cache: 'no-store',
          credentials: 'include',
        })
        if (analyticsRes.ok && !cancelled) {
          const analytics = await analyticsRes.json()
          setSalesData((p) => ({
            ...p,
            salesByDate: analytics.salesByDate || [],
          }))
        }
      } catch (err) {
        console.error('[VendorHome] Analytics fetch error:', err)
      }

      if (!cancelled) setLoadingStats(false)
    })()
    return () => {
      cancelled = true
    }
  }, [range])

  // Balance — independent of range (represents ongoing payable balance).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vendors/balance', { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        const b = json.balance || json
        if (cancelled) return
        setBalance({
          available: Number(b.available_balance ?? b.available ?? 0),
          pending: Number(b.pending_balance ?? b.pending ?? 0),
          held: Number(b.held_balance ?? b.held ?? 0),
        })
      } catch (err) {
        console.error('[VendorHome] Balance fetch error:', err)
      } finally {
        if (!cancelled) setLoadingBalance(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const calcTrend = (current: number, previous?: number) => {
    if (previous === undefined) return null
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const salesTrend = calcTrend(salesData.totalSales, salesData.previousTotalSales)
  const revenueTrend = calcTrend(salesData.totalRevenue, salesData.previousTotalRevenue)
  const avgOrder = salesData.totalSales > 0 ? salesData.totalRevenue / salesData.totalSales : 0

  const maxRevenue = Math.max(...salesData.salesByDate.map((d) => d.revenue), 1)
  const recent = salesData.recentActivity.slice(0, 5)

  const greeting = firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'

  return (
    <div className="px-4 py-6 md:px-8 md:py-10 max-w-5xl mx-auto space-y-10">
      {/* 1. Greeting */}
      <header>
        <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">
          Your studio
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
          {greeting}
        </h1>
        {vendorName && (
          <p className="font-body text-sm text-[#1a1a1a]/60 mt-2">
            Signed in as <span className="text-[#1a1a1a]">{vendorName}</span>.
          </p>
        )}
      </header>

      {/* 2. Pending payout hero */}
      <section>
        <ContentCard padding="lg">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-3">
                Available for your next payout
              </p>
              {loadingBalance ? (
                <div className="h-10 w-40 bg-[#1a1a1a]/5 rounded animate-pulse" />
              ) : (
                <p className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                  {formatCurrency(balance.available)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-[#1a1a1a]/70">
                <span>
                  <span className="text-[#1a1a1a]/50">Pending</span>{' '}
                  <span className="text-[#1a1a1a]">{formatCurrency(balance.pending)}</span>
                </span>
                {balance.held > 0 && (
                  <span>
                    <span className="text-[#1a1a1a]/50">Held</span>{' '}
                    <span className="text-[#1a1a1a]">{formatCurrency(balance.held)}</span>
                  </span>
                )}
              </div>
            </div>
            <Link
              href="/vendor/insights/payouts"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4 self-start md:self-auto"
            >
              View payouts <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </ContentCard>
      </section>

      {/* 3. Metric strip with range switcher */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
            {RANGE_LABEL[range]}
          </h2>
          <RangeSwitcher value={range} onChange={setRange} />
        </div>

        {loadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#1a1a1a]/5 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricTile
              label="Sales"
              value={String(salesData.totalSales)}
              trend={salesTrend}
            />
            <MetricTile
              label="Revenue"
              value={formatCurrency(salesData.totalRevenue)}
              trend={revenueTrend}
            />
            <MetricTile
              label="Average order"
              value={formatCurrency(avgOrder)}
              trend={null}
            />
          </div>
        )}
      </section>

      {/* 4. Sales spark */}
      {salesData.salesByDate.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
              Sales trend
            </h2>
            <Link
              href="/vendor/insights"
              className="font-body text-sm text-[#1a1a1a]/70 underline underline-offset-4"
            >
              Open sales
            </Link>
          </div>
          <ContentCard padding="md">
            <div className="flex items-end gap-[2px] h-28">
              {salesData.salesByDate.slice(-60).map((d, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#1a1a1a]/10 hover:bg-[#1a1a1a]/40 transition-colors"
                  style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 4)}%` }}
                  title={`${d.date}: ${formatCurrency(d.revenue)}`}
                />
              ))}
            </div>
          </ContentCard>
        </section>
      )}

      {/* 5. Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
            Recent activity
          </h2>
          {recent.length > 0 && (
            <Link
              href="/vendor/insights"
              className="font-body text-sm text-[#1a1a1a]/70 underline underline-offset-4"
            >
              See all
            </Link>
          )}
        </div>
        <ContentCard padding="md">
          {loadingStats ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#1a1a1a]/5 rounded animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center">
              <p className="font-body text-sm text-[#1a1a1a]/60">
                No sales yet in this window. Once an order is confirmed it will show up here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1a1a1a]/10">
              {recent.map((sale, i) => (
                <li key={sale.id || i} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-body text-sm font-medium text-[#1a1a1a]">
                      {new Date(sale.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="font-body text-xs text-[#1a1a1a]/60 mt-0.5">
                      {sale.quantity} {sale.quantity === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <span className="font-body text-sm font-medium text-[#1a1a1a]">
                    {formatCurrency(sale.price * sale.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>
      </section>
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
  const options: RangeKey[] = ['7d', '30d', '90d']
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
          {opt === '7d' ? '7 days' : opt === '30d' ? '30 days' : '90 days'}
        </button>
      ))}
    </div>
  )
}
