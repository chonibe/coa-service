'use client'

import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import Link from 'next/link'
import { ChevronRight, Shield, CreditCard, Lock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Profile Tab
//
// Your identity — profile hero, stats, and quick links to sub-sections.
// Will consume PremiumProfileHero and PremiumStatsGrid.
// Like your Instagram profile page.
// ============================================================================

const profileLinks = [
  {
    label: 'Certifications',
    description: 'Manage your artwork certifications',
    href: '/collector/profile/certifications',
    icon: Shield,
  },
  {
    label: 'Credits & Subscriptions',
    description: 'View your credits and manage subscriptions',
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
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile Hero placeholder — will consume PremiumProfileHero */}
      <ContentCard padding="lg">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-heading font-semibold text-gray-900 tracking-tight truncate">
              Collector
            </h1>
            <p className="text-sm text-gray-500 font-body">Member</p>
          </div>
        </div>

        {/* Stats row — will consume PremiumStatsGrid */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Artworks', value: '—' },
            { label: 'Authenticated', value: '—' },
            { label: 'Artists', value: '—' },
            { label: 'Series', value: '—' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold text-gray-900 font-body">{stat.value}</p>
              <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </ContentCard>

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
              <link.icon className="w-4.5 h-4.5" />
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
