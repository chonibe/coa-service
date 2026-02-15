'use client'

import { useEffect, useState, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { DollarSign, Clock, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Insights - Payouts — Phase 2.5
//
// API: /api/vendor/profile, /api/vendor/payouts, /api/vendor/payouts/pending-items,
//      /api/vendors/balance, /api/vendor/payout-readiness, /api/vendor/payouts/redeem
// Render: PayoutMetricsCards, payout list grouped by month, "Request Payment"
//         button with readiness check, pending items
// Old source: app/vendor/dashboard/payouts/page.tsx — most complex vendor page
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
]

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
  createdAt: string
  paypalEmail?: string
}

interface PendingItem {
  id: string
  productTitle: string
  amount: number
  date: string
  orderId: string
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  requested: { color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> },
  processing: { color: 'bg-blue-100 text-blue-700', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
  rejected: { color: 'bg-red-100 text-red-600', icon: <AlertCircle className="w-3 h-3" /> },
  failed: { color: 'bg-red-100 text-red-600', icon: <AlertCircle className="w-3 h-3" /> },
}

export default function VendorPayoutsPage() {
  const [balance, setBalance] = useState<Balance>({ available: 0, pending: 0, held: 0, currency: 'USD' })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPayoutData() {
      try {
        // Fetch balance
        const balRes = await fetch('/api/vendors/balance', { credentials: 'include' })
        if (balRes.ok) {
          const balJson = await balRes.json()
          setBalance({
            available: balJson.available || balJson.balance?.available || 0,
            pending: balJson.pending || balJson.balance?.pending || 0,
            held: balJson.held || balJson.balance?.held || 0,
            currency: balJson.currency || 'USD',
          })
        }
      } catch (err) {
        console.error('[Payouts] Balance fetch error:', err)
      }

      try {
        // Fetch payouts
        const payRes = await fetch('/api/vendor/payouts', { credentials: 'include' })
        if (payRes.ok) {
          const payJson = await payRes.json()
          setPayouts(
            (payJson.payouts || []).map((p: any) => ({
              id: p.id,
              amount: p.amount || 0,
              status: p.status || 'requested',
              createdAt: p.created_at || p.createdAt || '',
              paypalEmail: p.paypal_email || p.paypalEmail,
            }))
          )
        }
      } catch (err) {
        console.error('[Payouts] Payouts fetch error:', err)
      }

      try {
        // Fetch pending items
        const pendRes = await fetch('/api/vendor/payouts/pending-items', { credentials: 'include' })
        if (pendRes.ok) {
          const pendJson = await pendRes.json()
          setPendingItems(
            (pendJson.items || pendJson.pendingItems || []).map((item: any) => ({
              id: item.id,
              productTitle: item.product_title || item.productTitle || 'Unknown',
              amount: item.amount || item.payout_amount || 0,
              date: item.date || item.created_at || '',
              orderId: item.order_id || item.orderId || '',
            }))
          )
        }
      } catch (err) {
        console.error('[Payouts] Pending items fetch error:', err)
      }

      setLoading(false)
    }
    fetchPayoutData()
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: balance.currency }).format(amount)

  const handleRequestPayment = async () => {
    setRequesting(true)
    setRequestMessage(null)
    try {
      // Check readiness
      const readyRes = await fetch('/api/vendor/payout-readiness', { credentials: 'include' })
      if (readyRes.ok) {
        const readyJson = await readyRes.json()
        if (!readyJson.ready) {
          setRequestMessage(readyJson.reason || 'Not ready for payout. Please complete your payment setup.')
          setRequesting(false)
          return
        }
      }

      // Request payout
      const res = await fetch('/api/vendor/payouts/redeem', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json()
      if (res.ok) {
        setRequestMessage('Payment requested successfully!')
        // Refresh data
        setBalance((prev) => ({ ...prev, available: 0 }))
      } else {
        setRequestMessage(json.error || 'Failed to request payment.')
      }
    } catch (err) {
      setRequestMessage('Failed to request payment. Please try again.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-4 space-y-5">
        {/* Balance cards */}
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
          <div className="grid grid-cols-3 gap-3">
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
            <ContentCard padding="sm">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Held</p>
                <p className="text-lg font-bold text-gray-600 font-body">{formatCurrency(balance.held)}</p>
              </div>
            </ContentCard>
          </div>
        )}

        {/* Request Payment */}
        {balance.available > 0 && (
          <button
            onClick={handleRequestPayment}
            disabled={requesting}
            className="w-full py-3 rounded-impact-block-sm bg-impact-primary text-white text-sm font-bold font-body flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {requesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <DollarSign className="w-4 h-4" />
                Request Payment ({formatCurrency(balance.available)})
              </>
            )}
          </button>
        )}

        {requestMessage && (
          <div className={cn(
            'p-3 rounded-impact-block-sm text-sm font-body',
            requestMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          )}>
            {requestMessage}
          </div>
        )}

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <ContentCard
            padding="md"
            header={<ContentCardHeader title="Pending Items" description={`${pendingItems.length} items awaiting payout`} />}
          >
            <div className="space-y-3 mt-2">
              {pendingItems.slice(0, 10).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900 font-body truncate">{item.productTitle}</p>
                    <p className="text-xs text-gray-500 font-body">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 font-body">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </ContentCard>
        )}

        {/* Payout History */}
        <ContentCard
          padding="md"
          header={<ContentCardHeader title="Payout History" />}
        >
          {payouts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-body">No payouts yet</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {payouts.map((payout) => {
                const config = statusConfig[payout.status] || statusConfig.requested
                return (
                  <div key={payout.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold', config.color)}>
                        {config.icon}
                        {payout.status}
                      </div>
                      <span className="text-xs text-gray-500 font-body">
                        {new Date(payout.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 font-body">{formatCurrency(payout.amount)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </ContentCard>
      </div>
    </div>
  )
}
