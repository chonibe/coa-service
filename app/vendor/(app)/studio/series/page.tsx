'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Layers, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Studio - Series — Phase 2.3
//
// API: /api/vendor/series, /api/vendor/series/artworks
// Render: Series cards with cover art, title, member count, unlock type badge
// Tap series: Navigate to /vendor/dashboard/series/[id]
// Edit template: Navigate to /vendor/dashboard/artwork-pages/series/[seriesId]
// "Create Series": Navigate to /vendor/dashboard/series/create
// Old source: app/vendor/dashboard/series/page.tsx
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
]

interface Series {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string | null
  coverUrl?: string | null
  unlockType: string
  memberCount: number
  isActive: boolean
  isPrivate: boolean
  createdAt: string
}

const unlockTypeLabels: Record<string, string> = {
  any_purchase: 'Any Purchase',
  all_purchases: 'Collect All',
  sequential: 'Sequential',
  milestone: 'Milestone',
  threshold: 'Threshold',
  vip: 'VIP',
  time_based: 'Time-based',
}

const unlockTypeColors: Record<string, string> = {
  any_purchase: 'bg-green-100 text-green-700',
  all_purchases: 'bg-blue-100 text-blue-700',
  sequential: 'bg-purple-100 text-purple-700',
  milestone: 'bg-amber-100 text-amber-700',
  threshold: 'bg-orange-100 text-orange-700',
  vip: 'bg-pink-100 text-pink-700',
  time_based: 'bg-indigo-100 text-indigo-700',
}

export default function VendorSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await fetch('/api/vendor/series', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setSeriesList(
            (json.series || []).map((s: any) => ({
              id: s.id,
              name: s.name || s.title,
              description: s.description,
              thumbnailUrl: s.thumbnail_url || s.thumbnailUrl || s.cover_url || null,
              coverUrl: s.cover_url || s.coverUrl || null,
              unlockType: s.unlock_type || s.unlockType || 'any_purchase',
              memberCount: s.member_count || s.memberCount || s.artworks?.length || 0,
              isActive: s.is_active !== false,
              isPrivate: s.is_private || false,
              createdAt: s.created_at || s.createdAt || '',
            }))
          )
        }
      } catch (err) {
        console.error('[Series] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSeries()
  }, [])

  return (
    <div>
      <SubTabBar tabs={studioTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Create button */}
        <div className="flex justify-end">
          <Link
            href="/vendor/dashboard/series/create"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-impact-primary text-white text-xs font-bold"
          >
            <Plus className="w-3 h-3" /> Create Series
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ContentCard key={i} padding="md">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-20 h-20 rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">
              No series yet
            </p>
            <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
              Group your artworks into a series.
            </h3>
            <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed mb-6">
              Series hold the unlock experience your collectors receive when they scan the NFC
              chip — a shared template across every artwork in the collection.
            </p>
            <Link
              href="/vendor/dashboard/series/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-impact-primary text-white text-sm font-body font-semibold hover:opacity-85 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create series
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map((series) => (
              <ContentCard key={series.id} padding="md" hoverable>
                <div className="flex items-start gap-4">
                  {/* Cover art */}
                  <Link
                    href={`/vendor/dashboard/series/${series.id}`}
                    className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                  >
                    {(series.thumbnailUrl || series.coverUrl) ? (
                      <Image
                        src={series.thumbnailUrl || series.coverUrl!}
                        alt={series.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/vendor/dashboard/series/${series.id}`}>
                      <p className="text-sm font-semibold text-gray-900 font-body truncate hover:text-impact-primary transition-colors">
                        {series.name}
                      </p>
                    </Link>
                    {series.description && (
                      <p className="text-xs text-gray-500 font-body line-clamp-1 mt-0.5">{series.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        unlockTypeColors[series.unlockType] || 'bg-gray-100 text-gray-600'
                      )}>
                        {unlockTypeLabels[series.unlockType] || series.unlockType}
                      </span>
                      <span className="text-[10px] text-gray-500 font-body">
                        {series.memberCount} {series.memberCount === 1 ? 'artwork' : 'artworks'}
                      </span>
                      {series.isPrivate && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                          Hidden
                        </span>
                      )}
                    </div>

                    {/* Action links */}
                    <div className="flex items-center gap-3 mt-2">
                      <Link
                        href={`/vendor/dashboard/series/${series.id}`}
                        className="text-[10px] font-bold text-impact-primary font-body"
                      >
                        Edit Series
                      </Link>
                      <Link
                        href={`/vendor/dashboard/artwork-pages/series/${series.id}`}
                        className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500 font-body hover:text-impact-primary transition-colors"
                      >
                        <Sparkles className="w-3 h-3" /> Edit unlock experience
                      </Link>
                    </div>
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
