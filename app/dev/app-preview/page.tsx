'use client'

import { AppShell, collectorTabs, vendorTabs } from '@/components/app-shell'
import { CreateActionSheet } from '@/components/app-shell'
import { ContentCard, ProgressRing } from '@/components/app-shell'
import { ActivityFeed, type ActivityEvent } from '@/components/app-shell'
import { useState } from 'react'
import { Sparkles, Star, Gem, Gift, Shield, ShoppingBag } from 'lucide-react'

/**
 * Dev-only preview of the app shell (no auth required).
 * http://localhost:3000/dev/app-preview
 */

const mockEvents: ActivityEvent[] = [
  {
    id: '1',
    type: 'purchase',
    title: 'You purchased 2 artworks',
    description: 'Order #1042 — earned 350 credits',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: { label: 'View collection', href: '#' },
  },
  {
    id: '2',
    type: 'nfc_scan',
    title: 'Authenticated "Midnight Bloom"',
    description: 'NFC verified — earned 500 credits',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    type: 'credits_earned',
    title: 'Earned 350 credits',
    description: 'From your $35.00 purchase',
    timestamp: new Date(Date.now() - 3700000).toISOString(),
  },
  {
    id: '4',
    type: 'certificate_ready',
    title: 'Certificate ready for "Urban Flow"',
    description: 'Your certificate of authenticity is available',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    action: { label: 'View certificate', href: '#' },
  },
  {
    id: '5',
    type: 'series_progress',
    title: 'Street Scenes is 80% complete',
    description: '1 more artwork to finish the series — earn 1,000 credits!',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    action: { label: 'Complete series', href: '#' },
  },
  {
    id: '6',
    type: 'level_up',
    title: 'You reached Level 3!',
    description: 'New stage: Tagger — keep collecting to evolve!',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '7',
    type: 'perk_unlocked',
    title: 'You unlocked Free Proof Print!',
    description: 'Spend $24 total — claim your free print',
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    action: { label: 'Claim perk', href: '#' },
  },
]

export default function DevAppPreviewPage() {
  const [role, setRole] = useState<'collector' | 'vendor'>('collector')
  const [createOpen, setCreateOpen] = useState(false)
  const [view, setView] = useState<'shell' | 'profile' | 'activity'>('shell')

  return (
    <AppShell
      tabs={role === 'collector' ? collectorTabs : vendorTabs}
      headerProps={{
        showCart: role === 'collector',
        cartCount: 3,
        notificationCount: 2,
        creditBalance: role === 'collector' ? 1850 : null,
        logoHref: '/dev/app-preview',
      }}
      onCreatePress={role === 'vendor' ? () => setCreateOpen(true) : undefined}
    >
      {/* Dev controls */}
      <div className="sticky top-14 z-20 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-xs font-medium text-amber-800">Dev Preview</span>
          <div className="flex gap-2">
            <button
              onClick={() => setRole('collector')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === 'collector' ? 'bg-[#390000] text-[#ffba94]' : 'bg-amber-200 text-amber-800'
              }`}
            >
              Collector
            </button>
            <button
              onClick={() => setRole('vendor')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === 'vendor' ? 'bg-[#390000] text-[#ffba94]' : 'bg-amber-200 text-amber-800'
              }`}
            >
              Vendor
            </button>
          </div>
        </div>
        {/* View switcher */}
        <div className="flex gap-2 px-4 pb-2">
          {['shell', 'profile', 'activity'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium capitalize ${
                view === v ? 'bg-amber-300 text-amber-900' : 'bg-amber-200/50 text-amber-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Shell view */}
      {view === 'shell' && (
        <div className="px-4 py-4 space-y-4">
          <h1 className="text-impact-h3 font-heading tracking-tight text-gray-900">
            {role === 'collector' ? 'Collector' : 'Vendor'} App
          </h1>
          <p className="text-sm text-gray-500 font-body">
            Switch views above to see Profile (gamification) and Activity Feed.
          </p>
        </div>
      )}

      {/* Profile view (gamification showcase) */}
      {view === 'profile' && role === 'collector' && (
        <div className="px-4 py-4 space-y-4">
          {/* Profile hero */}
          <ContentCard padding="lg">
            <div className="flex items-center gap-4">
              <ProgressRing progress={65} size={80} strokeWidth={3} color="#2c4bce">
                <div className="w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#390000] to-[#5a1a1a] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#ffba94]" />
                </div>
              </ProgressRing>
              <div className="flex-1">
                <h1 className="text-lg font-heading font-semibold text-gray-900 tracking-tight">Demo Collector</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-impact-primary/10 text-impact-primary text-xs font-bold">
                    <Star className="w-3 h-3" /> LVL 3
                  </span>
                  <span className="text-xs text-gray-500 font-body">Tagger</span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-impact-primary rounded-full w-[65%]" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-5 py-3 bg-yellow-50 rounded-impact-block-sm">
              <Gem className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-900 font-body">1,850 credits</span>
              <span className="text-xs text-gray-500 font-body">($18.50 value)</span>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Artworks', value: 12 },
                { label: 'Verified', value: 8 },
                { label: 'Artists', value: 4 },
                { label: 'Series', value: 3 },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-semibold text-gray-900 font-body">{s.value}</p>
                  <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Perks */}
          <div className="grid grid-cols-2 gap-3">
            <ContentCard padding="sm" hoverable>
              <div className="flex flex-col items-center text-center py-1">
                <ProgressRing progress={100} size={52} strokeWidth={3} color="#00a341">
                  <Gift className="w-5 h-5 text-impact-success" />
                </ProgressRing>
                <p className="text-xs font-bold text-gray-900 font-body mt-2">Free Proof Print</p>
                <p className="text-[10px] text-impact-success font-body font-bold">Unlocked!</p>
              </div>
            </ContentCard>
            <ContentCard padding="sm" hoverable>
              <div className="flex flex-col items-center text-center py-1">
                <ProgressRing progress={72} size={52} strokeWidth={3} color="#f0c417">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </ProgressRing>
                <p className="text-xs font-bold text-gray-900 font-body mt-2">Free Lamp</p>
                <p className="text-[10px] text-gray-500 font-body">72% — spend $71 more</p>
              </div>
            </ContentCard>
          </div>
        </div>
      )}

      {view === 'profile' && role === 'vendor' && (
        <div className="px-4 py-6 text-center text-sm text-gray-400 font-body">
          Switch to Collector to see the gamified profile
        </div>
      )}

      {/* Activity feed view */}
      {view === 'activity' && (
        <div>
          <ActivityFeed events={mockEvents} />
        </div>
      )}

      {role === 'vendor' && (
        <CreateActionSheet isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      )}
    </AppShell>
  )
}
