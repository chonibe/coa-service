'use client'

import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Vendor Media Sub-Tab
//
// Media library — upload and manage images, video, audio.
// Will consume media-library page.
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
]

export default function VendorMediaPage() {
  return (
    <div>
      <SubTabBar tabs={studioTabs} />
      <div className="px-4 py-4">
        <p className="text-center text-sm text-gray-400 font-body py-12">
          Your media library will appear here
        </p>
      </div>
    </div>
  )
}
