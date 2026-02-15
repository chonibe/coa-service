'use client'

import { useEffect, useState, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { Award } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Editions Sub-tab — Phase 1.2
//
// API: /api/collector/editions
// Render: Cards with edition number, total, artwork image, limited/open badge
// Filters: Limited editions / Open editions / All
// Old source: editions-gallery.tsx
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

interface Edition {
  id: number
  lineItemId: string
  name: string
  editionNumber: number | null
  editionTotal: number | null
  editionType: 'limited' | 'open' | null
  imgUrl: string | null
  vendorName: string | null
  purchaseDate: string
}

type FilterBy = 'all' | 'limited' | 'open'

export default function CollectorEditionsPage() {
  const [editions, setEditions] = useState<Edition[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBy, setFilterBy] = useState<FilterBy>('all')

  useEffect(() => {
    async function fetchEditions() {
      try {
        const res = await fetch('/api/collector/editions')
        const json = await res.json()
        if (json.success || json.editions) {
          setEditions(json.editions || [])
        }
      } catch (err) {
        console.error('[Editions] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEditions()
  }, [])

  const filtered = useMemo(() => {
    if (filterBy === 'all') return editions
    return editions.filter((e) => e.editionType === filterBy)
  }, [editions, filterBy])

  const filters: { value: FilterBy; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'limited', label: 'Limited' },
    { value: 'open', label: 'Open' },
  ]

  return (
    <div>
      <SubTabBar tabs={collectionTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Filter pills */}
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterBy(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold font-body transition-all',
                filterBy === f.value
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ContentCard key={i} padding="md">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-16 h-20 rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No editions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((edition) => (
              <Link key={edition.id} href={`/collector/artwork/${edition.lineItemId}`}>
                <ContentCard padding="md" hoverable>
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {edition.imgUrl ? (
                        <Image
                          src={edition.imgUrl}
                          alt={edition.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No img
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-body truncate">
                        {edition.name}
                      </p>
                      {edition.vendorName && (
                        <p className="text-xs text-gray-500 font-body">{edition.vendorName}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {edition.editionNumber != null && (
                          <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            #{edition.editionNumber}
                            {edition.editionTotal ? `/${edition.editionTotal}` : ''}
                          </span>
                        )}
                        {edition.editionType && (
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                              edition.editionType === 'limited'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            )}
                          >
                            {edition.editionType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </ContentCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
