'use client'

import { useEffect, useState, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { Users, Search, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Insights - Collectors — Phase 2.6
//
// API: /api/vendor/collectors
// Render: Collector cards with name, total spent, artwork count, search + sort
// Old source: app/vendor/dashboard/collectors/page.tsx
// ============================================================================

const insightsTabs: SubTab[] = [
  { id: 'overview', label: 'Overview', href: '/vendor/insights' },
  { id: 'payouts', label: 'Payouts', href: '/vendor/insights/payouts' },
  { id: 'collectors', label: 'Collectors', href: '/vendor/insights/collectors' },
  { id: 'taxes', label: 'Taxes', href: '/vendor/insights/taxes' },
]

interface Collector {
  id: string
  name: string
  email?: string
  totalSpent: number
  purchaseCount: number
  lastPurchaseDate: string | null
  engagementScore?: number
  artworkThumbnails?: string[]
}

type SortBy = 'recent' | 'value' | 'engagement'

export default function VendorCollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  useEffect(() => {
    async function fetchCollectors() {
      try {
        const res = await fetch('/api/vendor/collectors', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setCollectors(
            (json.collectors || []).map((c: any) => ({
              id: c.id || c.collector_id,
              name: c.name || c.display_name || c.email || 'Anonymous',
              email: c.email,
              totalSpent: c.total_spent || c.totalSpent || 0,
              purchaseCount: c.purchase_count || c.purchaseCount || 0,
              lastPurchaseDate: c.last_purchase_date || c.lastPurchaseDate || null,
              engagementScore: c.engagement_score || c.engagementScore || 0,
              artworkThumbnails: c.artwork_thumbnails || c.artworkThumbnails || [],
            }))
          )
        }
      } catch (err) {
        console.error('[Collectors] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCollectors()
  }, [])

  const filtered = useMemo(() => {
    let result = [...collectors]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.totalSpent - a.totalSpent
        case 'engagement':
          return (b.engagementScore || 0) - (a.engagementScore || 0)
        case 'recent':
        default:
          if (!a.lastPurchaseDate && !b.lastPurchaseDate) return 0
          if (!a.lastPurchaseDate) return 1
          if (!b.lastPurchaseDate) return -1
          return new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
      }
    })

    return result
  }, [collectors, searchQuery, sortBy])

  const totalRevenue = collectors.reduce((sum, c) => sum + c.totalSpent, 0)
  const avgPurchaseValue = collectors.length > 0 ? totalRevenue / collectors.reduce((sum, c) => sum + c.purchaseCount, 0) : 0

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const sorts: { value: SortBy; label: string }[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'value', label: 'Value' },
    { value: 'engagement', label: 'Engagement' },
  ]

  return (
    <div>
      <SubTabBar tabs={insightsTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <ContentCard padding="sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Collectors</p>
              <p className="text-lg font-bold text-gray-900 font-body">{collectors.length}</p>
            </div>
          </ContentCard>
          <ContentCard padding="sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Revenue</p>
              <p className="text-lg font-bold text-gray-900 font-body">{formatCurrency(totalRevenue)}</p>
            </div>
          </ContentCard>
          <ContentCard padding="sm">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 font-body uppercase tracking-wide">Avg Value</p>
              <p className="text-lg font-bold text-gray-900 font-body">{formatCurrency(avgPurchaseValue || 0)}</p>
            </div>
          </ContentCard>
        </div>

        {/* Search + Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search collectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-impact-block-sm text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20"
            />
          </div>
          <div className="flex gap-1">
            {sorts.map((s) => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-full text-[10px] font-bold font-body transition-all',
                  sortBy === s.value
                    ? 'bg-[#390000] text-[#ffba94]'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collectors list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContentCard key={i} padding="md">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-16" />
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">
              {searchQuery ? 'No collectors match your search' : 'No collectors yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((collector) => (
              <ContentCard key={collector.id} padding="md">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-gray-600 font-body">
                      {collector.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 font-body truncate">{collector.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-body">
                        <ShoppingBag className="w-3 h-3" /> {collector.purchaseCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-body">
                        <DollarSign className="w-3 h-3" /> {formatCurrency(collector.totalSpent)}
                      </span>
                    </div>
                    {collector.lastPurchaseDate && (
                      <p className="text-[10px] text-gray-400 font-body mt-1">
                        Last purchase: {new Date(collector.lastPurchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
