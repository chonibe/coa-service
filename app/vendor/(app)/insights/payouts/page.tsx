'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SubTabBar, type SubTab, ContentCard, ContentCardHeader } from '@/components/app-shell'
import { PayoutMetricsCards } from '@/components/payouts/payout-metrics-cards'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  DollarSign,
  Download,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

// ============================================================================
// Vendor Insights - Payouts — parity rebuild
//
// Three local tabs:
//   Overview — announcement bar (prerequisites + $25 gate), balance strip,
//              metrics, Orders in process (unfulfilled), Ready to request
//              (fulfilled), commission explainer.
//   Pending  — `status === 'requested'` payouts with 3-step timeline.
//   History  — filters (search, status, date), month-grouped list, CSV export,
//              invoice PDF download, expandable line items.
//
// APIs consumed:
//   GET  /api/vendor/profile
//   GET  /api/vendors/balance
//   GET  /api/vendor/payouts
//   GET  /api/vendor/payouts/pending-items   (returns lineItems / groupedByMonth /
//                                             unfulfilledItems / unfulfilledGroupedByMonth)
//   GET  /api/vendor/payout-readiness        (returns { readiness: { isReady, ... } })
//   POST /api/vendor/payouts/redeem
//   GET  /api/vendors/payouts/:id/invoice    (PDF download)
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
  { id: 'taxes', label: 'Taxes', href: '/vendor/insights/taxes' },
]

// Fallback only; the authoritative value is fetched from /api/vendor/payouts/config.
const MINIMUM_PAYOUT_AMOUNT_FALLBACK = 25

type LocalTab = 'overview' | 'pending' | 'history'

interface Balance {
  available: number
  pending: number
  held: number
  currency: string
}

interface Payout {
  id: string
  amount: number
  status: string
  date: string
  reference?: string | null
  invoiceNumber?: string | null
  products?: number
  rejectionReason?: string | null
  failureReason?: string | null
  processedAt?: string | null
  canceledAt?: string | null
  items?: Array<{
    item_name: string
    date: string
    amount: number
    payout_reference?: string
  }>
}

interface PayoutsConfig {
  minimumPayoutAmount: number
  defaultPayoutPercentage: number
  currency: string
  processingWindowDays: [number, number]
  paymentProvider: string
}

interface PendingItem {
  line_item_id: string
  order_name: string
  product_title: string
  payout_amount: number
  created_at: string
  fulfillment_status: string
}

interface GroupedMonth {
  month: string
  monthKey: string
  items: PendingItem[]
  totalAmount: number
  itemCount: number
}

interface Readiness {
  isReady: boolean
  prerequisites?: {
    hasPayPalEmail: boolean
    hasValidPayPalEmail: boolean
    hasTaxId: boolean
    hasTaxCountry: boolean
    hasAcceptedTerms: boolean
    hasMinimumBalance: boolean
    currentBalance: number
    minimumRequired: number
  }
  missingItems?: string[]
}

type StatusFilter = 'all' | 'requested' | 'processing' | 'completed' | 'rejected' | 'failed' | 'canceled'
type DateFilter = 'all' | '30d' | '90d' | '1y' | 'this-year'
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

const statusStyles: Record<string, string> = {
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  canceled: 'bg-gray-100 text-gray-600 border-gray-200',
}

const statusLabel: Record<string, string> = {
  requested: 'Reviewing',
  processing: 'Processing',
  completed: 'Paid',
  paid: 'Paid',
  rejected: 'Rejected',
  failed: 'Failed',
  canceled: 'Canceled',
}

function isPaidStatus(status: string) {
  return status === 'completed' || status === 'paid'
}

export default function VendorPayoutsPage() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<LocalTab>('overview')

  const [balance, setBalance] = useState<Balance>({ available: 0, pending: 0, held: 0, currency: 'USD' })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [fulfilledByMonth, setFulfilledByMonth] = useState<GroupedMonth[]>([])
  const [unfulfilledByMonth, setUnfulfilledByMonth] = useState<GroupedMonth[]>([])
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [config, setConfig] = useState<PayoutsConfig>({
    minimumPayoutAmount: MINIMUM_PAYOUT_AMOUNT_FALLBACK,
    defaultPayoutPercentage: 25,
    currency: 'USD',
    processingWindowDays: [1, 3],
    paymentProvider: 'paypal',
  })

  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [expandedPayouts, setExpandedPayouts] = useState<Set<string>>(new Set())

  // History filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  const [searchQuery, setSearchQuery] = useState('')

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: balance.currency }).format(amount)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [balRes, payRes, pendRes, readyRes, cfgRes] = await Promise.all([
        fetch('/api/vendors/balance', { credentials: 'include' }),
        fetch('/api/vendor/payouts', { credentials: 'include' }),
        fetch('/api/vendor/payouts/pending-items', { credentials: 'include' }),
        fetch('/api/vendor/payout-readiness', { credentials: 'include' }),
        fetch('/api/vendor/payouts/config', { credentials: 'include' }),
      ])

      if (cfgRes.ok) {
        const cfgJson = await cfgRes.json()
        setConfig({
          minimumPayoutAmount: Number(cfgJson.minimumPayoutAmount) || MINIMUM_PAYOUT_AMOUNT_FALLBACK,
          defaultPayoutPercentage: Number(cfgJson.defaultPayoutPercentage) || 25,
          currency: cfgJson.currency || 'USD',
          processingWindowDays: (Array.isArray(cfgJson.processingWindowDays) && cfgJson.processingWindowDays.length === 2)
            ? cfgJson.processingWindowDays
            : [1, 3],
          paymentProvider: cfgJson.paymentProvider || 'paypal',
        })
      }

      if (balRes.ok) {
        const balJson = await balRes.json()
        const b = balJson.balance || balJson
        setBalance({
          available: Number(b.available_balance ?? b.available ?? 0),
          pending: Number(b.pending_balance ?? b.pending ?? 0),
          held: Number(b.held_balance ?? b.held ?? 0),
          currency: b.currency || 'USD',
        })
      }

      if (payRes.ok) {
        const payJson = await payRes.json()
        setPayouts(
          (payJson.payouts || []).map((p: any) => ({
            id: String(p.id),
            amount: Number(p.amount) || 0,
            status: p.status || 'requested',
            // Prefer display_date (pre-formatted); fall back to ISO date -> local string
            date: p.display_date || (p.date ? new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''),
            reference: p.reference ?? null,
            invoiceNumber: p.invoice_number ?? null,
            products: p.products ?? 0,
            rejectionReason: p.rejection_reason ?? null,
            failureReason: p.failure_reason ?? null,
            processedAt: p.processed_at ?? null,
            canceledAt: p.canceled_at ?? null,
            items: p.items || [],
          }))
        )
      }

      if (pendRes.ok) {
        const pendJson = await pendRes.json()
        setFulfilledByMonth(pendJson.groupedByMonth || [])
        setUnfulfilledByMonth(pendJson.unfulfilledGroupedByMonth || [])
      }

      if (readyRes.ok) {
        const readyJson = await readyRes.json()
        setReadiness(readyJson.readiness || null)
      }
    } catch (err) {
      console.error('[Payouts] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  const handleRequestPayment = async () => {
    setRequesting(true)
    try {
      // Correctly read readiness.isReady (API returns { success, readiness: { isReady, ... } }).
      const readyRes = await fetch('/api/vendor/payout-readiness', { credentials: 'include' })
      let isReady = false
      if (readyRes.ok) {
        const j = await readyRes.json()
        isReady = Boolean(j?.readiness?.isReady)
      }
      if (!isReady) {
        toast({
          title: 'Not ready for payout',
          description:
            'Complete your payment settings and make sure your available balance is at least $' +
            config.minimumPayoutAmount + '.',
          variant: 'destructive',
        })
        setRequesting(false)
        return
      }

      const res = await fetch('/api/vendor/payouts/redeem', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json?.error || 'Failed to request payment')
      }

      toast({
        title: 'Payment request sent',
        description: json?.note || "We've received your request. You'll be notified when it's approved.",
      })
      await fetchAll()
      setActiveTab('pending')
    } catch (err: any) {
      toast({
        title: 'Request failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRequesting(false)
    }
  }

  const toggleMonth = (key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const togglePayout = (id: string) => {
    setExpandedPayouts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyReference = async (ref: string) => {
    try {
      await navigator.clipboard.writeText(ref)
      toast({ title: 'Reference copied', description: ref })
    } catch {
      toast({ title: 'Unable to copy', variant: 'destructive' })
    }
  }

  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const cancelPayout = async (payoutId: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Cancel this payout request? The amount will be returned to your available balance.'
      )
      if (!confirmed) return
    }
    setCancelingId(payoutId)
    try {
      const res = await fetch(`/api/vendor/payouts/${payoutId}/cancel`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Canceled from payouts page' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Cancel failed')
      toast({
        title: 'Payout canceled',
        description: json?.message || 'Your balance has been restored.',
      })
      await fetchAll()
    } catch (err: any) {
      toast({
        title: 'Could not cancel',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCancelingId(null)
    }
  }

  const [retryingId, setRetryingId] = useState<string | null>(null)
  const retryPayout = async (payoutId: string) => {
    setRetryingId(payoutId)
    try {
      const res = await fetch(`/api/vendor/payouts/${payoutId}/retry`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'Retry failed')
      toast({
        title: 'Payout re-queued',
        description: json?.message || 'An admin will review it again.',
      })
      await fetchAll()
      setActiveTab('pending')
    } catch (err: any) {
      toast({
        title: 'Could not retry',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setRetryingId(null)
    }
  }

  const downloadInvoice = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/vendors/payouts/${payoutId}/invoice`, { credentials: 'include' })
      if (!res.ok) throw new Error('Invoice not available yet')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${payoutId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      toast({
        title: 'Invoice unavailable',
        description: err?.message || 'Try again once the payout is processed.',
        variant: 'destructive',
      })
    }
  }

  // History: filter + sort (only completed/paid/canceled/rejected/failed — never the in-flight requested/processing)
  const historyPayouts = useMemo(() => {
    let list = payouts.filter((p) => p.status !== 'requested' && p.status !== 'processing')

    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter)

    if (dateFilter !== 'all') {
      const now = new Date()
      let start = new Date(0)
      switch (dateFilter) {
        case '30d':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
          break
        case '90d':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)
          break
        case '1y':
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        case 'this-year':
          start = new Date(now.getFullYear(), 0, 1)
          break
      }
      list = list.filter((p) => {
        if (!p.date) return false
        return new Date(p.date) >= start
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (p) =>
          p.reference?.toLowerCase().includes(q) ||
          p.invoiceNumber?.toLowerCase().includes(q) ||
          String(p.amount).toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'amount-desc':
          return b.amount - a.amount
        case 'amount-asc':
          return a.amount - b.amount
        default:
          return 0
      }
    })

    return list
  }, [payouts, statusFilter, dateFilter, sortOption, searchQuery])

  const historyByMonth = useMemo(() => {
    const map = new Map<string, { month: string; monthKey: string; payouts: Payout[]; total: number }>()
    historyPayouts.forEach((p) => {
      const d = p.date ? new Date(p.date) : new Date()
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      if (!map.has(key)) map.set(key, { month: label, monthKey: key, payouts: [], total: 0 })
      const g = map.get(key)!
      g.payouts.push(p)
      g.total += p.amount
    })
    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey))
  }, [historyPayouts])

  const pendingPayouts = useMemo(
    () => payouts.filter((p) => p.status === 'requested' || p.status === 'processing'),
    [payouts]
  )

  const exportCsv = () => {
    const header = ['Date', 'Reference', 'Invoice', 'Status', 'Amount', 'Items']
    const rows = historyPayouts.map((p) => [
      p.date ? new Date(p.date).toISOString().slice(0, 10) : '',
      p.reference || '',
      p.invoiceNumber || '',
      p.status,
      p.amount.toFixed(2),
      String(p.products ?? p.items?.length ?? 0),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payouts-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const missingItems = readiness?.missingItems || []
  const hasPrereqGap = readiness
    ? !readiness.prerequisites?.hasPayPalEmail ||
      !readiness.prerequisites?.hasValidPayPalEmail ||
      !readiness.prerequisites?.hasTaxId ||
      !readiness.prerequisites?.hasTaxCountry ||
      !readiness.prerequisites?.hasAcceptedTerms
    : false
  const belowMinimum = balance.available < config.minimumPayoutAmount

  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-4 max-w-5xl mx-auto space-y-5">
        {/* Local tab switcher */}
        <div className="flex gap-1 border-b border-[#1a1a1a]/10">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'pending', label: `Pending${pendingPayouts.length ? ` · ${pendingPayouts.length}` : ''}` },
              { id: 'history', label: 'History' },
            ] as { id: LocalTab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-3 py-2 font-body text-sm border-b-2 -mb-px transition-colors',
                activeTab === t.id
                  ? 'border-[#1a1a1a] text-[#1a1a1a] font-semibold'
                  : 'border-transparent text-[#1a1a1a]/60 hover:text-[#1a1a1a]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <OverviewTab
            loading={loading}
            balance={balance}
            config={config}
            formatCurrency={formatCurrency}
            hasPrereqGap={hasPrereqGap}
            missingItems={missingItems}
            belowMinimum={belowMinimum}
            requesting={requesting}
            readiness={readiness}
            fulfilledByMonth={fulfilledByMonth}
            unfulfilledByMonth={unfulfilledByMonth}
            expandedMonths={expandedMonths}
            toggleMonth={toggleMonth}
            handleRequestPayment={handleRequestPayment}
          />
        )}

        {activeTab === 'pending' && (
          <PendingTab
            pendingPayouts={pendingPayouts}
            formatCurrency={formatCurrency}
            copyReference={copyReference}
            loading={loading}
            config={config}
            cancelPayout={cancelPayout}
            cancelingId={cancelingId}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            loading={loading}
            historyByMonth={historyByMonth}
            formatCurrency={formatCurrency}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            exportCsv={exportCsv}
            expandedPayouts={expandedPayouts}
            togglePayout={togglePayout}
            copyReference={copyReference}
            downloadInvoice={downloadInvoice}
            retryPayout={retryPayout}
            retryingId={retryingId}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Overview tab
// ============================================================================

function OverviewTab({
  loading,
  balance,
  config,
  formatCurrency,
  hasPrereqGap,
  missingItems,
  belowMinimum,
  requesting,
  readiness,
  fulfilledByMonth,
  unfulfilledByMonth,
  expandedMonths,
  toggleMonth,
  handleRequestPayment,
}: {
  loading: boolean
  balance: Balance
  config: PayoutsConfig
  formatCurrency: (n: number) => string
  hasPrereqGap: boolean
  missingItems: string[]
  belowMinimum: boolean
  requesting: boolean
  readiness: Readiness | null
  fulfilledByMonth: GroupedMonth[]
  unfulfilledByMonth: GroupedMonth[]
  expandedMonths: Set<string>
  toggleMonth: (k: string) => void
  handleRequestPayment: () => void
}) {
  const isReady = Boolean(readiness?.isReady)
  const [etaMinDays, etaMaxDays] = config.processingWindowDays
  const etaCopy =
    etaMinDays === etaMaxDays
      ? `typically processed within ${etaMinDays} business day${etaMinDays === 1 ? '' : 's'}`
      : `typically processed within ${etaMinDays}\u2013${etaMaxDays} business days`

  return (
    <>
      {/* Announcement bar */}
      {hasPrereqGap ? (
        <div className="rounded-impact-block-sm border border-amber-200 bg-amber-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-sm font-semibold text-amber-900">
                Complete your payment settings
              </p>
              <p className="font-body text-xs text-amber-800 mt-1">
                We need {missingItems.slice(0, 3).join(', ')}
                {missingItems.length > 3 ? `, and ${missingItems.length - 3} more` : ''} before you can request a payout.
              </p>
            </div>
          </div>
          <Link
            href="/vendor/profile/settings#payment"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-amber-600 text-white text-xs font-bold font-body hover:bg-amber-700 transition-colors shrink-0"
          >
            Open payment settings <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : belowMinimum ? (
        <div className="rounded-impact-block-sm border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-body text-sm font-semibold text-blue-900">
              Minimum payout is {formatCurrency(config.minimumPayoutAmount)}
            </p>
            <p className="font-body text-xs text-blue-800 mt-1">
              You currently have {formatCurrency(balance.available)} available. Once you cross{' '}
              {formatCurrency(config.minimumPayoutAmount)} you can request a payment from here.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-impact-block-sm border border-green-200 bg-green-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-body text-sm font-semibold text-green-900">
                You&apos;re ready to request a payment
              </p>
              <p className="font-body text-xs text-green-800 mt-1">
                Available balance: {formatCurrency(balance.available)} — {etaCopy}.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPayment}
            disabled={requesting || !isReady}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-bold font-body hover:bg-green-700 transition-colors disabled:opacity-50 shrink-0"
          >
            {requesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Request payment
              </>
            )}
          </button>
        </div>
      )}

      {/* Balance strip */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ContentCard key={i} padding="sm">
              <div className="animate-pulse space-y-2 text-center">
                <div className="h-3 bg-gray-100 rounded w-12 mx-auto" />
                <div className="h-5 bg-gray-100 rounded w-16 mx-auto" />
              </div>
            </ContentCard>
          ))}
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-3',
            balance.held > 0 ? 'grid-cols-3' : 'grid-cols-2'
          )}
        >
          <ContentCard padding="sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Available</p>
              <p className="text-lg font-bold text-green-600 font-body">{formatCurrency(balance.available)}</p>
            </div>
          </ContentCard>
          <ContentCard padding="sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Pending</p>
              <p className="text-lg font-bold text-amber-600 font-body">{formatCurrency(balance.pending)}</p>
            </div>
          </ContentCard>
          {balance.held > 0 && (
            <ContentCard padding="sm">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Held</p>
                <p className="text-lg font-bold text-gray-600 font-body">{formatCurrency(balance.held)}</p>
              </div>
            </ContentCard>
          )}
        </div>
      )}

      {/* Payout metrics */}
      <PayoutMetricsCards />

      {/* Orders in process (unfulfilled) */}
      {unfulfilledByMonth.length > 0 && (
        <ContentCard
          padding="md"
          header={
            <ContentCardHeader
              title="Orders in process"
              description="Unfulfilled orders — payouts unlock once the order is fulfilled."
            />
          }
        >
          <MonthAccordion
            groups={unfulfilledByMonth}
            expandedMonths={expandedMonths}
            toggleMonth={toggleMonth}
            formatCurrency={formatCurrency}
            keyPrefix="unfulfilled"
          />
        </ContentCard>
      )}

      {/* Ready to request (fulfilled) */}
      {fulfilledByMonth.length > 0 && (
        <ContentCard
          padding="md"
          header={
            <ContentCardHeader
              title="Ready to request"
              description="Fulfilled orders eligible for your next payout."
            />
          }
        >
          <MonthAccordion
            groups={fulfilledByMonth}
            expandedMonths={expandedMonths}
            toggleMonth={toggleMonth}
            formatCurrency={formatCurrency}
            keyPrefix="fulfilled"
          />
        </ContentCard>
      )}

      {/* Commission explainer */}
      <ContentCard padding="md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-body text-sm font-semibold text-[#1a1a1a]">
              How is my payout calculated?
            </p>
            <p className="font-body text-xs text-[#1a1a1a]/60 mt-1 leading-relaxed">
              Your payout is a fixed percentage of the item price, unlocked once the order ships.
              Settings for commission and payment method live in your profile.
            </p>
          </div>
          <Link
            href="/vendor/profile/settings"
            className="font-body text-xs font-medium text-[#1a1a1a] underline underline-offset-4 shrink-0"
          >
            Open settings
          </Link>
        </div>
      </ContentCard>
    </>
  )
}

// ============================================================================
// Pending tab
// ============================================================================

function PendingTab({
  pendingPayouts,
  formatCurrency,
  copyReference,
  loading,
  config,
  cancelPayout,
  cancelingId,
}: {
  pendingPayouts: Payout[]
  formatCurrency: (n: number) => string
  copyReference: (ref: string) => void
  loading: boolean
  config: PayoutsConfig
  cancelPayout: (id: string) => void
  cancelingId: string | null
}) {
  const [etaMinDays, etaMaxDays] = config.processingWindowDays
  const etaLabel =
    etaMinDays === etaMaxDays
      ? `${etaMinDays} business day${etaMinDays === 1 ? '' : 's'}`
      : `${etaMinDays}\u2013${etaMaxDays} business days`

  if (loading) {
    return (
      <ContentCard padding="md">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-100 rounded w-40" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </ContentCard>
    )
  }

  if (pendingPayouts.length === 0) {
    return (
      <ContentCard padding="md">
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-body">No pending requests</p>
          <p className="text-xs text-gray-400 font-body mt-1">
            Once you request a payment, you&apos;ll be able to track its status here.
          </p>
        </div>
      </ContentCard>
    )
  }

  return (
    <div className="space-y-3">
      {pendingPayouts.map((p) => {
        const isCanceling = cancelingId === p.id
        const isCancellable = p.status === 'requested'
        return (
          <ContentCard key={p.id} padding="md">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                  Requested
                </p>
                <p className="font-heading text-2xl font-semibold text-[#1a1a1a] mt-1">
                  {formatCurrency(p.amount)}
                </p>
                <p className="font-body text-xs text-[#1a1a1a]/60 mt-1">
                  {p.date ? new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  {p.reference && (
                    <>
                      {' · '}
                      <button
                        type="button"
                        onClick={() => p.reference && copyReference(p.reference)}
                        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-[#1a1a1a]"
                      >
                        {p.reference}
                        <Copy className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold font-body border',
                  statusStyles[p.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                )}
              >
                {p.status === 'processing' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}
                {statusLabel[p.status] || p.status}
              </span>
            </div>

            <Timeline status={p.status} />

            {/* Line-item disclosure: tell the artist exactly what's locked in this request. */}
            {p.items && p.items.length > 0 && (
              <details className="mt-4 group">
                <summary className="cursor-pointer list-none flex items-center justify-between font-body text-xs text-[#1a1a1a]/70 hover:text-[#1a1a1a]">
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                    {p.items.length} item{p.items.length === 1 ? '' : 's'} included
                  </span>
                  <span className="text-[#1a1a1a]/50">
                    {formatCurrency(
                      p.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
                    )}
                  </span>
                </summary>
                <ul className="mt-2 ml-3 pl-3 border-l border-[#1a1a1a]/10 space-y-1.5">
                  {p.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between font-body text-xs">
                      <span className="text-[#1a1a1a]/70 truncate mr-2">
                        {it.item_name}
                        {it.date && (
                          <span className="text-[#1a1a1a]/40">
                            {' · '}
                            {new Date(it.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </span>
                      <span className="text-[#1a1a1a] tabular-nums">
                        {formatCurrency(Number(it.amount) || 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="font-body text-[11px] text-[#1a1a1a]/50">
                Payments are typically processed within {etaLabel} after admin review.
              </p>
              {isCancellable && (
                <button
                  type="button"
                  onClick={() => cancelPayout(p.id)}
                  disabled={isCanceling}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-red-200 text-red-700 hover:bg-red-50 text-[11px] font-bold font-body disabled:opacity-50 shrink-0"
                >
                  {isCanceling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                  {isCanceling ? 'Canceling…' : 'Cancel request'}
                </button>
              )}
            </div>
          </ContentCard>
        )
      })}
    </div>
  )
}

function Timeline({ status }: { status: string }) {
  // 3 steps: Submitted → Admin review → Processing
  const steps = [
    { id: 'submitted', label: 'Submitted' },
    { id: 'review', label: 'Admin review' },
    { id: 'processing', label: 'Processing' },
  ]
  const activeIndex = status === 'processing' ? 2 : status === 'requested' ? 1 : 0

  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = i < activeIndex
        const active = i === activeIndex
        return (
          <li key={s.id} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border',
                done
                  ? 'bg-green-500 text-white border-green-500'
                  : active
                  ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                  : 'bg-white text-gray-400 border-gray-300'
              )}
            >
              {done ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={cn(
                'font-body text-xs flex-1 truncate',
                done || active ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'
              )}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div className={cn('h-px flex-1', done ? 'bg-green-500' : 'bg-gray-200')} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ============================================================================
// History tab
// ============================================================================

function HistoryTab({
  loading,
  historyByMonth,
  formatCurrency,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  sortOption,
  setSortOption,
  exportCsv,
  expandedPayouts,
  togglePayout,
  copyReference,
  downloadInvoice,
  retryPayout,
  retryingId,
}: {
  loading: boolean
  historyByMonth: { month: string; monthKey: string; payouts: Payout[]; total: number }[]
  formatCurrency: (n: number) => string
  searchQuery: string
  setSearchQuery: (s: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter) => void
  dateFilter: DateFilter
  setDateFilter: (s: DateFilter) => void
  sortOption: SortOption
  setSortOption: (s: SortOption) => void
  exportCsv: () => void
  expandedPayouts: Set<string>
  togglePayout: (id: string) => void
  copyReference: (ref: string) => void
  downloadInvoice: (id: string) => void
  retryPayout: (id: string) => void
  retryingId: string | null
}) {
  // Phase 5.5 — mobile-friendly filter stack. On mobile we collapse the
  // three selects into a "Filters" toggle with active-count chip so the
  // search bar doesn't get pushed below the fold. Desktop keeps the
  // horizontal row that power users expect.
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (dateFilter !== 'all' ? 1 : 0) +
    (sortOption !== 'date-desc' ? 1 : 0)
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false)

  return (
    <>
      <ContentCard padding="md">
        {/* Top row: search + actions (always visible). */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search payouts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]/10"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="md:hidden inline-flex items-center gap-1 px-3 py-2 rounded-md border border-gray-200 text-sm font-body font-medium text-[#1a1a1a] hover:bg-gray-50 shrink-0"
            aria-expanded={mobileFiltersOpen}
            aria-label="Show filters"
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1a1a1a] text-white text-[10px] font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-gray-200 text-sm font-body font-medium text-[#1a1a1a] hover:bg-gray-50 shrink-0"
            aria-label="Export CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>

        {/* Filter row — always visible on md+, mobile toggled via sheet. */}
        <div
          className={cn(
            'gap-2 mt-2',
            mobileFiltersOpen ? 'grid grid-cols-1 sm:grid-cols-3' : 'hidden',
            'md:flex md:flex-row md:items-center md:mt-2',
          )}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-gray-200 px-2 py-2 text-sm font-body bg-white w-full md:w-auto"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="requested">Reviewing</option>
            <option value="processing">Processing</option>
            <option value="completed">Paid</option>
            <option value="rejected">Rejected</option>
            <option value="failed">Failed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="rounded-md border border-gray-200 px-2 py-2 text-sm font-body bg-white w-full md:w-auto"
            aria-label="Filter by date"
          >
            <option value="all">All time</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="this-year">This year</option>
            <option value="1y">Last 12 months</option>
          </select>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="rounded-md border border-gray-200 px-2 py-2 text-sm font-body bg-white w-full md:w-auto"
            aria-label="Sort"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Largest first</option>
            <option value="amount-asc">Smallest first</option>
          </select>
        </div>
      </ContentCard>

      {loading ? (
        <ContentCard padding="md">
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-100 rounded w-40" />
            <div className="h-16 bg-gray-100 rounded" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        </ContentCard>
      ) : historyByMonth.length === 0 ? (
        <ContentCard padding="md">
          <div className="text-center py-8">
            <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-body">No payouts match your filters</p>
          </div>
        </ContentCard>
      ) : (
        <div className="space-y-4">
          {historyByMonth.map((group) => (
            <ContentCard key={group.monthKey} padding="md">
              <div className="flex items-center justify-between mb-3">
                <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                  {group.month}
                </p>
                <p className="font-body text-sm font-semibold text-[#1a1a1a]">
                  {formatCurrency(group.total)}
                </p>
              </div>
              <ul className="divide-y divide-[#1a1a1a]/10">
                {group.payouts.map((p) => {
                  const expanded = expandedPayouts.has(p.id)
                  const invoiceAvailable = isPaidStatus(p.status)
                  const isFailed = p.status === 'failed'
                  const isRetrying = retryingId === p.id
                  const hasReason =
                    (p.status === 'rejected' && p.rejectionReason) ||
                    (p.status === 'failed' && p.failureReason)
                  return (
                    <li key={p.id} className="py-3">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => togglePayout(p.id)}
                          className="flex-1 text-left min-w-0"
                          aria-expanded={expanded}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-body border',
                                statusStyles[p.status] || 'bg-gray-50 text-gray-700 border-gray-200'
                              )}
                            >
                              {statusLabel[p.status] || p.status}
                            </span>
                            <span className="font-body text-xs text-[#1a1a1a]/60">
                              {p.date
                                ? new Date(p.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </div>
                          {p.reference && (
                            <p className="font-body text-xs text-[#1a1a1a]/50 mt-1 truncate">
                              {p.reference}
                            </p>
                          )}
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <p className="font-body text-sm font-semibold text-[#1a1a1a] tabular-nums">
                            {formatCurrency(p.amount)}
                          </p>
                          {p.reference && (
                            <button
                              type="button"
                              onClick={() => p.reference && copyReference(p.reference)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                              title="Copy reference"
                              aria-label="Copy reference"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {invoiceAvailable && (
                            <button
                              type="button"
                              onClick={() => downloadInvoice(p.id)}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                              title="Download invoice"
                              aria-label="Download invoice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePayout(p.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                          >
                            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {hasReason && (
                        <div className="mt-2 ml-3 pl-3 border-l-2 border-red-200 bg-red-50/40 rounded-r p-2">
                          <p className="font-body text-[11px] font-semibold text-red-700 uppercase tracking-wide">
                            {p.status === 'rejected' ? 'Why it was rejected' : 'Why it failed'}
                          </p>
                          <p className="font-body text-xs text-red-800 mt-0.5">
                            {p.status === 'rejected' ? p.rejectionReason : p.failureReason}
                          </p>
                          {p.status === 'rejected' && (
                            <p className="font-body text-[11px] text-red-700/70 mt-1">
                              Your balance was restored — you can request a new payout from Overview.
                            </p>
                          )}
                          {isFailed && (
                            <button
                              type="button"
                              onClick={() => retryPayout(p.id)}
                              disabled={isRetrying}
                              className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-[11px] font-bold font-body hover:bg-red-700 disabled:opacity-50"
                            >
                              {isRetrying ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              {isRetrying ? 'Retrying…' : 'Retry payout'}
                            </button>
                          )}
                        </div>
                      )}

                      {expanded && p.items && p.items.length > 0 && (
                        <ul className="mt-3 ml-3 pl-3 border-l border-[#1a1a1a]/10 space-y-1.5">
                          {p.items.map((it, i) => (
                            <li key={i} className="flex items-center justify-between font-body text-xs">
                              <span className="text-[#1a1a1a]/70 truncate mr-2">
                                {it.item_name}
                                {it.date && (
                                  <span className="text-[#1a1a1a]/40">
                                    {' · '}
                                    {new Date(it.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                )}
                              </span>
                              <span className="text-[#1a1a1a] tabular-nums">
                                {formatCurrency(it.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </ContentCard>
          ))}
        </div>
      )}
    </>
  )
}

// ============================================================================
// Shared month accordion (Overview tab)
// ============================================================================

function MonthAccordion({
  groups,
  expandedMonths,
  toggleMonth,
  formatCurrency,
  keyPrefix,
}: {
  groups: GroupedMonth[]
  expandedMonths: Set<string>
  toggleMonth: (k: string) => void
  formatCurrency: (n: number) => string
  keyPrefix: string
}) {
  return (
    <ul className="divide-y divide-[#1a1a1a]/10">
      {groups.map((g) => {
        const fullKey = `${keyPrefix}:${g.monthKey}`
        const expanded = expandedMonths.has(fullKey)
        return (
          <li key={fullKey} className="py-2">
            <button
              type="button"
              onClick={() => toggleMonth(fullKey)}
              className="flex items-center justify-between w-full text-left"
              aria-expanded={expanded}
            >
              <div className="flex items-center gap-2 min-w-0">
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-[#1a1a1a]/50" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#1a1a1a]/50" />
                )}
                <span className="font-body text-sm text-[#1a1a1a]">{g.month}</span>
                <span className="font-body text-[11px] text-[#1a1a1a]/50">
                  · {g.itemCount} {g.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <span className="font-body text-sm font-semibold text-[#1a1a1a] tabular-nums">
                {formatCurrency(g.totalAmount)}
              </span>
            </button>
            {expanded && (
              <ul className="mt-2 ml-6 space-y-1.5">
                {g.items.map((it) => (
                  <li key={it.line_item_id} className="flex items-center justify-between font-body text-xs">
                    <span className="text-[#1a1a1a]/70 truncate mr-2">
                      {it.product_title}
                      {it.order_name && (
                        <span className="text-[#1a1a1a]/40"> · {it.order_name}</span>
                      )}
                    </span>
                    <span className="text-[#1a1a1a] tabular-nums">
                      {formatCurrency(Number(it.payout_amount) || 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}
