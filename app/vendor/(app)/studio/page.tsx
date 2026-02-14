'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Vendor Studio Tab
//
// Your artworks grid — "your posts." Each artwork is a visual card.
// Sub-tabs: Artworks / Series / Media
// Tap an artwork to open its block editor.
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
]

export default function VendorStudioPage() {
  return (
    <div>
      <SubTabBar tabs={studioTabs} />

      <div className="px-4 py-4">
        {/* Artworks grid placeholder — will consume products listing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs animate-pulse"
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 font-body mt-8">
          Your artworks grid will appear here — tap any artwork to edit its blocks
        </p>
      </div>
    </div>
  )
}
