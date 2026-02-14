'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Collection Tab
//
// YOUR art. The grid of artworks you own.
// Sub-tabs: Grid / Editions / Series / Artists
// Like Instagram's profile posts grid.
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

export default function CollectorCollectionPage() {
  return (
    <div>
      <SubTabBar tabs={collectionTabs} />

      <div className="px-4 py-4">
        {/* Collection stats bar */}
        <div className="flex items-center gap-6 mb-4 text-sm text-gray-500 font-body">
          <span><strong className="text-gray-900">—</strong> Artworks</span>
          <span><strong className="text-gray-900">—</strong> Authenticated</span>
          <span><strong className="text-gray-900">—</strong> Artists</span>
        </div>

        {/* Artwork grid placeholder — will consume ArtworkGrid component */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs animate-pulse"
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 font-body mt-8">
          Your artwork collection grid will appear here
        </p>
      </div>
    </div>
  )
}
