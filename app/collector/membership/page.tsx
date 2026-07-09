'use client'

/**
 * Collector Membership Dashboard
 * 
 * Shows membership status, credit balance, transaction history,
 * and subscription management options.
 */

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  Star,
  Zap,
  Crown,
  ArrowUp,
  ArrowDown,
  History,
  Settings,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { MEMBERSHIP_TIERS, APPRECIATION_SCHEDULE, type MembershipTierId } from '@/lib/membership/tiers'
import { cn } from '@/lib/utils'
import { getCollectorPageContent } from '@/lib/content/site-content'

interface MembershipStatus {
  isMember: boolean
  subscription: {
    id: string
    tier: MembershipTierId
    status: string
    monthlyCredits: number
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    cancelledAt?: string
    createdAt: string
  } | null
  credits: {
    balance: number
    valueUsd: number
  }
  tier: {
    id: MembershipTierId
    name: string
    priceMonthly: number
    monthlyCredits: number
    features: string[]
    color: string
  } | null
  recentTransactions: Array<{
    id: string
    transaction_type: string
    credits_amount: number
    usd_amount: number
    description: string
    created_at: string
    credit_source: string
  }>
}

const tierIcons = {
  collector: Star,
  curator: Zap,
  founding: Crown,
}

const membershipContent = getCollectorPageContent('membership')

export default function MembershipDashboardPage() {
  const router = useRouter()
  const [status, setStatus] = useState<MembershipStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/membership/status')
      if (!res.ok) throw new Error(membershipContent.errors.fetchStatus)
      const data = await res.json()
      setStatus(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm(membershipContent.notices.cancelConfirm)) {
      return
    }

    setActionLoading('cancel')
    try {
      const res = await fetch('/api/membership/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      await fetchStatus()
      alert(membershipContent.notices.cancelSuccess)
    } catch (err: any) {
      alert(err.message || membershipContent.notices.cancelError)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async () => {
    setActionLoading('reactivate')
    try {
      const res = await fetch('/api/membership/cancel', {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      await fetchStatus()
      alert(membershipContent.notices.reactivateSuccess)
    } catch (err: any) {
      alert(err.message || membershipContent.notices.reactivateError)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  if (!status?.isMember) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          {membershipContent.nonMember.hero.title}
        </h1>
        <p className="text-slate-600 mb-8">
          {membershipContent.nonMember.hero.subtitle}
        </p>
        <Link href="/shop/membership">
          <Button size="lg">{membershipContent.nonMember.ctaLabel}</Button>
        </Link>
      </div>
    )
  }

  const tier = status.tier!
  const subscription = status.subscription!
  const TierIcon = tierIcons[tier.id]
  const periodEnd = new Date(subscription.currentPeriodEnd)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{membershipContent.header.title}</h1>
          <p className="text-slate-600">{membershipContent.header.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/shop">
            <Button variant="outline">{membershipContent.header.secondaryCta}</Button>
          </Link>
        </div>
      </div>

      {/* Cancellation Notice */}
      {subscription.cancelAtPeriodEnd && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span>
              {membershipContent.notices.endingOn(periodEnd.toLocaleDateString())}
            </span>
          </div>
          <Button
            onClick={handleReactivate}
            disabled={actionLoading === 'reactivate'}
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-100"
          >
            {actionLoading === 'reactivate' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {membershipContent.notices.reactivateCta}
          </Button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Credit Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">{membershipContent.credits.title}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">
                  {status.credits.balance.toLocaleString()}
                </span>
                <span className="text-slate-400">{membershipContent.credits.unit}</span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {membershipContent.credits.value(status.credits.valueUsd)}
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <Coins className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          {/* Appreciation Info */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-medium">{membershipContent.credits.appreciationTitle}</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              {membershipContent.credits.appreciationBody}
            </p>
            <div className="flex gap-2 flex-wrap">
              {APPRECIATION_SCHEDULE.slice(1).map(schedule => (
                <div 
                  key={schedule.months}
                  className="px-3 py-1 bg-white/10 rounded-full text-xs"
                >
                  {schedule.months}mo: +{Math.round((schedule.multiplier - 1) * 100)}%
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${tier.color}20` }}
            >
              <TierIcon className="w-6 h-6" style={{ color: tier.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{tier.name}</h3>
              <p className="text-sm text-slate-500">
                ${tier.priceMonthly}/month
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{membershipContent.subscription.status}</span>
              <span className={cn(
                'font-medium',
                subscription.status === 'active' ? 'text-green-600' : 'text-amber-600'
              )}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{membershipContent.subscription.monthlyCredits}</span>
              <span className="font-medium">{tier.monthlyCredits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{membershipContent.subscription.nextBilling}</span>
              <span className="font-medium">
                {periodEnd.toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/shop/membership">
              <Button variant="outline" className="w-full">
                <ArrowUp className="w-4 h-4 mr-2" />
                {membershipContent.subscription.changeTier}
              </Button>
            </Link>
            {!subscription.cancelAtPeriodEnd && (
              <Button 
                variant="ghost" 
                className="w-full text-slate-500 hover:text-red-600"
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {membershipContent.subscription.cancelCta}
              </Button>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">{membershipContent.transactions.title}</h3>
            </div>
          </div>

          {status.recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {membershipContent.transactions.empty}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {status.recentTransactions.map(tx => (
                <div 
                  key={tx.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      tx.credits_amount > 0 
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    )}>
                      {tx.credits_amount > 0 ? (
                        <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {tx.description}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()} 
                        {tx.credit_source && ` • ${tx.credit_source}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-semibold',
                      tx.credits_amount > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {tx.credits_amount > 0 ? '+' : ''}{tx.credits_amount}
                    </p>
                    <p className="text-sm text-slate-500">
                      ${Math.abs(tx.usd_amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tier Features */}
        <div className="lg:col-span-3">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {membershipContent.benefits.title(tier.name)}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tier.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200"
              >
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: tier.color }} />
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
