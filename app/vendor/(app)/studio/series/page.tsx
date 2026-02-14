'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Vendor Series Sub-Tab
//
// Series as albums/boards. Visual cards with covers.
// Will consume series management page.
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
]

export default function VendorSeriesPage() {
  return (
    <div>
      <SubTabBar tabs={studioTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Your series (albums/boards) will appear here
        </p>
      </div>
    </div>
  )
}
