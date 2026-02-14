'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Artists Sub-Tab
//
// Artists you collect — stats, progress, journey links.
// Will consume ArtistsCollection component.
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

export default function CollectorArtistsPage() {
  return (
    <div>
      <SubTabBar tabs={collectionTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Your collected artists will appear here — with stats and journey links
        </p>
      </div>
    </div>
  )
}
