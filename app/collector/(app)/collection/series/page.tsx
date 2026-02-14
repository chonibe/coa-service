'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Series Sub-Tab
//
// Series binder view — your collected series.
// Will consume SeriesBinder component.
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

export default function CollectorSeriesPage() {
  return (
    <div>
      <SubTabBar tabs={collectionTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Series binders will appear here — your collected series with progress
        </p>
      </div>
    </div>
  )
}
