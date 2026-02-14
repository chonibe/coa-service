'use client'

import { useState } from 'react'
import { AppShell, vendorTabs } from '@/components/app-shell'
import { CreateActionSheet } from '@/components/app-shell'

// ============================================================================
// Vendor App Layout
//
// Wraps all vendor app routes with the unified AppShell.
// Provides: SlimHeader + BottomTabBar with "+" create button + CreateActionSheet
// Auth is handled by the parent /vendor/layout.tsx (server component).
// ============================================================================

export default function VendorAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  return (
    <AppShell
      tabs={vendorTabs}
      headerProps={{
        showCart: false,
        logoHref: '/vendor/home',
      }}
      onCreatePress={() => setCreateSheetOpen(true)}
    >
      {children}

      {/* Create Action Sheet (triggered by "+" tab) */}
      <CreateActionSheet
        isOpen={createSheetOpen}
        onClose={() => setCreateSheetOpen(false)}
        options={[
          {
            id: 'artwork',
            label: 'New Artwork',
            description: 'Create a new artwork with rich content blocks',
            icon: <ImageIcon className="w-6 h-6" />,
            onClick: () => {
              // TODO: Navigate to create flow
              console.log('[Create] New Artwork')
            },
          },
          {
            id: 'series',
            label: 'New Series',
            description: 'Organize artworks into a series',
            icon: <LayersIcon className="w-6 h-6" />,
            onClick: () => {
              console.log('[Create] New Series')
            },
          },
          {
            id: 'media',
            label: 'Upload Media',
            description: 'Add images, video, or audio to your library',
            icon: <UploadIcon className="w-6 h-6" />,
            onClick: () => {
              console.log('[Create] Upload Media')
            },
          },
        ]}
      />
    </AppShell>
  )
}

// Icons used in the create sheet options
import { Image as ImageIcon, Layers as LayersIcon, Upload as UploadIcon } from 'lucide-react'
