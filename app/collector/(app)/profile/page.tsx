'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from '@/components/app-shell'
import { ProgressRing } from '@/components/app-shell'
import Link from 'next/link'
import {
  ChevronRight,
  Shield,
  CreditCard,
  Lock,
  Settings,
  Gem,
  Gift,
  Sparkles,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Profile Tab
//
// Your identity with gamification front-and-center:
// - Ink-O-Gatchi avatar with level/XP progress bar
// - Perk unlock progress (Free Lamp, Free Proof Print)
// - Stats grid
// - Quick links to sub-sections
// ============================================================================

// Evolution stage names and thresholds (from inkogatchi-widget.tsx)
const EVOLUTION_STAGES = [
  { name: 'Rookie', minLevel: 1 },
  { name: 'Tagger', minLevel: 3 },
  { name: 'Artist', minLevel: 6 },
  { name: 'Legend', minLevel: 10 },
]

function getEvolutionStage(level: number): string {
  for (let i = EVOLUTION_STAGES.length - 1; i >= 0; i--) {
    if (level >= EVOLUTION_STAGES[i].minLevel) return EVOLUTION_STAGES[i].name
  }
  return 'Rookie'
}

// Perk thresholds (from banking/types.ts)
const LAMP_THRESHOLD_CREDITS = 2550
const PROOF_PRINT_THRESHOLD_CREDITS = 240

interface ProfileData {
  displayName: string
  email: string
  level: number
  xpProgress: number // 0-100
  totalCreditsEarned: number
  creditsBalance: number
  stats: {
    totalArtworks: number
    authenticated: number
    artists: number
    series: number
  }
}

const profileLinks = [
  {
    label: 'Certifications',
    description: 'Manage your artwork certifications',
    href: '/collector/profile/certifications',
    icon: Shield,
  },
  {
    label: 'Credits & Subscriptions',
    description: 'View balance, earn, and redeem',
    href: '/collector/profile/credits',
    icon: CreditCard,
  },
  {
    label: 'Hidden Content',
    description: 'Unlocked rewards and bonus content',
    href: '/collector/profile/hidden-content',
    icon: Lock,
  },
  {
    label: 'Settings',
    description: 'Account settings and preferences',
    href: '/collector/profile/settings',
    icon: Settings,
  },
]

export default function CollectorProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success) {
          const { stats, banking, profile } = json
          const totalCreditsEarned = banking?.totalCreditsEarned || banking?.credits_earned || 0
          const level = Math.floor(Math.sqrt(totalCreditsEarned / 50)) + 1
          const currentLevelCredits = (level - 1) ** 2 * 50
          const nextLevelCredits = level ** 2 * 50
          const xpProgress = nextLevelCredits > currentLevelCredits
            ? ((totalCreditsEarned - currentLevelCredits) / (nextLevelCredits - currentLevelCredits)) * 100
            : 100

          setData({
            displayName: profile?.display_name || json.collectorIdentifier || 'Collector',
            email: json.collectorIdentifier || '',
            level,
            xpProgress: Math.min(xpProgress, 100),
            totalCreditsEarned,
            creditsBalance: banking?.credits_balance || 0,
            stats: {
              totalArtworks: stats?.totalArtworksOwned || 0,
              authenticated: stats?.authenticatedCount || 0,
              artists: json.artists?.length || 0,
              series: json.series?.length || 0,
            },
          })
        }
      } catch (err) {
        console.error('[Profile] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <ContentCard padding="lg">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        </ContentCard>
      </div>
    )
  }

  const level = data?.level || 1
  const stage = getEvolutionStage(level)
  const lampProgress = Math.min((data?.totalCreditsEarned || 0) / LAMP_THRESHOLD_CREDITS * 100, 100)
  const proofProgress = Math.min((data?.totalCreditsEarned || 0) / PROOF_PRINT_THRESHOLD_CREDITS * 100, 100)

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile Hero with Ink-O-Gatchi */}
      <ContentCard padding="lg">
        <div className="flex items-center gap-4">
          {/* Avatar with level ring */}
          <ProgressRing
            progress={data?.xpProgress || 0}
            size={80}
            strokeWidth={3}
            color="#2c4bce"
          >
            <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#390000] to-[#5a1a1a] flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#ffba94]" />
            </div>
          </ProgressRing>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-heading font-semibold text-gray-900 tracking-tight truncate">
              {data?.displayName || 'Collector'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-impact-primary/10 text-impact-primary text-xs font-bold">
                <Star className="w-3 h-3" />
                LVL {level}
              </span>
              <span className="text-xs text-gray-500 font-body">{stage}</span>
            </div>
            {/* XP bar */}
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-impact-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${data?.xpProgress || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Credits badge */}
        <div className="flex items-center justify-center gap-2 mt-5 py-3 bg-yellow-50 rounded-impact-block-sm">
          <Gem className="w-4 h-4 text-impact-secondary-text" />
          <span className="text-sm font-bold text-gray-900 font-body">
            {(data?.creditsBalance || 0).toLocaleString()} credits
          </span>
          <span className="text-xs text-gray-500 font-body">
            (${((data?.creditsBalance || 0) / 100).toFixed(2)} value)
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
          {[
            { label: 'Artworks', value: data?.stats.totalArtworks || 0 },
            { label: 'Verified', value: data?.stats.authenticated || 0 },
            { label: 'Artists', value: data?.stats.artists || 0 },
            { label: 'Series', value: data?.stats.series || 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold text-gray-900 font-body">{stat.value}</p>
              <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* Perk Progress Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Free Proof Print */}
        <ContentCard padding="sm" hoverable>
          <div className="flex flex-col items-center text-center py-1">
            <ProgressRing
              progress={proofProgress}
              size={52}
              strokeWidth={3}
              color={proofProgress >= 100 ? '#00a341' : '#2c4bce'}
            >
              <Gift className={cn('w-5 h-5', proofProgress >= 100 ? 'text-impact-success' : 'text-impact-primary')} />
            </ProgressRing>
            <p className="text-xs font-bold text-gray-900 font-body mt-2">Free Proof Print</p>
            <p className="text-[10px] text-gray-500 font-body">
              {proofProgress >= 100 ? 'Unlocked!' : `${Math.round(proofProgress)}% — spend $${(PROOF_PRINT_THRESHOLD_CREDITS / 10 - (data?.totalCreditsEarned || 0) / 10).toFixed(0)} more`}
            </p>
          </div>
        </ContentCard>

        {/* Free Lamp */}
        <ContentCard padding="sm" hoverable>
          <div className="flex flex-col items-center text-center py-1">
            <ProgressRing
              progress={lampProgress}
              size={52}
              strokeWidth={3}
              color={lampProgress >= 100 ? '#00a341' : '#f0c417'}
            >
              <Sparkles className={cn('w-5 h-5', lampProgress >= 100 ? 'text-impact-success' : 'text-amber-500')} />
            </ProgressRing>
            <p className="text-xs font-bold text-gray-900 font-body mt-2">Free Lamp</p>
            <p className="text-[10px] text-gray-500 font-body">
              {lampProgress >= 100 ? 'Unlocked!' : `${Math.round(lampProgress)}% — spend $${(LAMP_THRESHOLD_CREDITS / 10 - (data?.totalCreditsEarned || 0) / 10).toFixed(0)} more`}
            </p>
          </div>
        </ContentCard>
      </div>

      {/* Profile Links */}
      <ContentCard padding="none">
        {profileLinks.map((link, index) => (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5',
              'hover:bg-gray-50 active:bg-gray-100',
              'transition-colors duration-200',
              index < profileLinks.length - 1 && 'border-b border-gray-50'
            )}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-600 shrink-0">
              <link.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 font-body">{link.label}</p>
              <p className="text-xs text-gray-500 font-body">{link.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </ContentCard>
    </div>
  )
}
