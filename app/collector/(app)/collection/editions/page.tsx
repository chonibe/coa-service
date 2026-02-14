'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Editions Sub-Tab
//
// Editions gallery with grouping and filtering.
// Will consume EditionsGallery component.
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

export default function CollectorEditionsPage() {
  return (
    <div>
      <SubTabBar tabs={collectionTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Editions gallery will appear here — grouped by item or artist
        </p>
      </div>
    </div>
  )
}
