'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from '@/components/app-shell'
import { ProgressRing } from '@/components/app-shell'
import { Gem, Gift, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Credits & Subscriptions Page
//
// Full credits dashboard: balance, earn/spend history, perk progress
// ============================================================================

const LAMP_THRESHOLD_CREDITS = 2550
const PROOF_PRINT_THRESHOLD_CREDITS = 240

export default function CollectorCreditsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success) {
          setData(json.banking || {})
        }
      } catch (err) {
        console.error('[Credits] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCredits()
  }, [])

  const balance = data?.credits_balance || data?.creditsBalance || 0
  const totalEarned = data?.totalCreditsEarned || data?.credits_earned || 0
  const totalSpent = data?.totalCreditsSpent || data?.credits_spent || 0
  const lampProgress = Math.min((totalEarned / LAMP_THRESHOLD_CREDITS) * 100, 100)
  const proofProgress = Math.min((totalEarned / PROOF_PRINT_THRESHOLD_CREDITS) * 100, 100)

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="h-32 bg-gray-100 rounded-impact-block animate-pulse" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-lg font-heading font-semibold text-gray-900">Credits & Subscriptions</h1>

      {/* Balance hero */}
      <ContentCard padding="lg">
        <div className="text-center">
          <Gem className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-gray-900 font-body">{balance.toLocaleString()}</p>
          <p className="text-sm text-gray-500 font-body">Available Credits</p>
          <p className="text-xs text-gray-400 font-body mt-1">${(balance / 100).toFixed(2)} value</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-semibold text-impact-success font-body">
              +{totalEarned.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">Total Earned</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-impact-error font-body">
              -{totalSpent.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">Total Spent</p>
          </div>
        </div>
      </ContentCard>

      {/* Perk Progress */}
      <h2 className="text-sm font-bold text-gray-900 font-body uppercase tracking-wider">Perk Progress</h2>
      <div className="space-y-3">
        <ContentCard padding="md" hoverable>
          <div className="flex items-center gap-4">
            <ProgressRing
              progress={proofProgress}
              size={52}
              strokeWidth={3}
              color={proofProgress >= 100 ? '#00a341' : '#2c4bce'}
            >
              <Gift className={cn('w-5 h-5', proofProgress >= 100 ? 'text-impact-success' : 'text-impact-primary')} />
            </ProgressRing>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 font-body">Free Proof Print</p>
              <p className="text-xs text-gray-500 font-body">
                {proofProgress >= 100
                  ? 'Unlocked — you can redeem this perk!'
                  : `${Math.round(proofProgress)}% — spend $${Math.max(0, PROOF_PRINT_THRESHOLD_CREDITS / 10 - totalEarned / 10).toFixed(0)} more`}
              </p>
            </div>
          </div>
        </ContentCard>

        <ContentCard padding="md" hoverable>
          <div className="flex items-center gap-4">
            <ProgressRing
              progress={lampProgress}
              size={52}
              strokeWidth={3}
              color={lampProgress >= 100 ? '#00a341' : '#f0c417'}
            >
              <Sparkles className={cn('w-5 h-5', lampProgress >= 100 ? 'text-impact-success' : 'text-amber-500')} />
            </ProgressRing>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 font-body">Free Lamp</p>
              <p className="text-xs text-gray-500 font-body">
                {lampProgress >= 100
                  ? 'Unlocked — you can redeem this perk!'
                  : `${Math.round(lampProgress)}% — spend $${Math.max(0, LAMP_THRESHOLD_CREDITS / 10 - totalEarned / 10).toFixed(0)} more`}
              </p>
            </div>
          </div>
        </ContentCard>
      </div>

      {/* How to earn */}
      <ContentCard padding="md">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-impact-primary" />
          <h3 className="text-sm font-bold text-gray-900 font-body">How to earn credits</h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-600 font-body">
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-gray-400" />
            <span>Earn <strong>10 credits per $1 spent</strong> on any purchase</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-gray-400" />
            <span>Earn <strong>500 credits</strong> for each NFC authentication scan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-gray-400" />
            <span>Earn <strong>1,000 credits</strong> for completing a series</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 mt-0.5 w-1 h-1 rounded-full bg-gray-400" />
            <span>Earn <strong>bonus credits</strong> from referrals and special events</span>
          </li>
        </ul>
      </ContentCard>
    </div>
  )
}
