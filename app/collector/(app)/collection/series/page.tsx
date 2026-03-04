'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import { ProgressRing } from '@/components/app-shell'
import { Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Series Sub-Tab
//
// Series collection with progress rings and completion rewards.
// Shows how close you are to completing each series.
// Completing a series earns 1,000 credits.
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

interface SeriesProgress {
  seriesId: string
  seriesName: string
  artistName: string
  thumbnailUrl?: string
  ownedCount: number
  totalCount: number
  completed: boolean
}

export default function CollectorSeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success && json.series) {
          setSeriesList(
            json.series.map((s: any) => ({
              seriesId: s.id || s.series_id,
              seriesName: s.name || s.series_name || 'Unknown Series',
              artistName: s.vendor_name || s.artist_name || '',
              thumbnailUrl: s.thumbnail_url || s.image_url,
              ownedCount: s.owned_count || s.collected || 0,
              totalCount: s.total_count || s.total || 1,
              completed: s.completed || (s.owned_count >= s.total_count),
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
      <SubTabBar tabs={collectionTabs} />

      <div className="px-4 py-4 space-y-3">
        {/* Completion reward callout */}
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-impact-block-sm text-xs font-body">
          <Gem className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-gray-700">
            Complete a series to earn <strong className="text-gray-900">1,000 credits</strong>
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ContentCard key={i} padding="md">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400 font-body">
              No series in your collection yet. Buy artworks from a series to start tracking progress.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {seriesList.map((series) => {
              const progress = series.totalCount > 0
                ? (series.ownedCount / series.totalCount) * 100
                : 0
              const remaining = series.totalCount - series.ownedCount

              return (
                <ContentCard key={series.seriesId} padding="md" hoverable>
                  <div className="flex items-center gap-4">
                    {/* Progress ring with thumbnail */}
                    <ProgressRing
                      progress={progress}
                      size={56}
                      strokeWidth={3}
                      color={series.completed ? '#00a341' : '#047AFF'}
                    >
                      {series.thumbnailUrl ? (
                        <img
                          src={series.thumbnailUrl}
                          alt=""
                          className="w-[46px] h-[46px] rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-[46px] h-[46px] rounded-full bg-gray-100" />
                      )}
                    </ProgressRing>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-body truncate">
                        {series.seriesName}
                      </p>
                      <p className="text-xs text-gray-500 font-body">{series.artistName}</p>

                      {/* Progress text */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          'text-xs font-bold font-body',
                          series.completed ? 'text-impact-success' : 'text-impact-primary'
                        )}>
                          {series.ownedCount}/{series.totalCount}
                        </span>
                        {series.completed ? (
                          <span className="text-[10px] font-bold text-impact-success bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Complete!
                          </span>
                        ) : remaining <= 2 ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {remaining} more to go!
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </ContentCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
