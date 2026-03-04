'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import { ProgressRing } from '@/components/app-shell'
import Link from 'next/link'
import { Users } from 'lucide-react'

// ============================================================================
// Collector Artists Sub-tab — Phase 1.3
//
// API: /api/collector/dashboard (returns artists array)
// Render: Artist cards with avatar, name, artwork count
// Tap: Navigate to /collector/artists/[name]
// Old source: artists-collection.tsx
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

interface ArtistSummary {
  vendorName: string
  totalArtworksOwned: number
  totalSeriesCollected: number
  completionRate: number
  firstPurchaseDate: string | null
}

export default function CollectorArtistsPage() {
  const [artists, setArtists] = useState<ArtistSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArtists() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success && json.artists) {
          setArtists(
            json.artists.map((a: any) => ({
              vendorName: a.vendorName || a.vendor_name || 'Unknown Artist',
              totalArtworksOwned: a.totalArtworksOwned || a.total_artworks_owned || 0,
              totalSeriesCollected: a.totalSeriesCollected || a.total_series_collected || 0,
              completionRate: a.completionRate || a.completion_rate || 0,
              firstPurchaseDate: a.firstPurchaseDate || a.first_purchase_date || null,
            }))
          )
        }
      } catch (err) {
        console.error('[Artists] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchArtists()
  }, [])

  return (
    <div>
      <SubTabBar tabs={collectionTabs} />

      <div className="px-4 py-4 space-y-3">
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
        ) : artists.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No artists in your collection yet</p>
            <p className="text-xs text-gray-400 font-body mt-1">
              Buy art to start connecting with artists.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {artists.map((artist) => (
              <Link
                key={artist.vendorName}
                href={`/collector/artists/${encodeURIComponent(artist.vendorName)}`}
              >
                <ContentCard padding="md" hoverable>
                  <div className="flex items-center gap-4">
                    {/* Avatar with completion ring */}
                    <ProgressRing
                      progress={artist.completionRate}
                      size={56}
                      strokeWidth={3}
                      color={artist.completionRate >= 100 ? '#00a341' : '#047AFF'}
                    >
                      <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600 font-body">
                          {artist.vendorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </ProgressRing>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 font-body truncate">
                        {artist.vendorName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 font-body">
                          {artist.totalArtworksOwned} {artist.totalArtworksOwned === 1 ? 'artwork' : 'artworks'}
                        </span>
                        <span className="text-xs text-gray-500 font-body">
                          {artist.totalSeriesCollected} {artist.totalSeriesCollected === 1 ? 'series' : 'series'}
                        </span>
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
