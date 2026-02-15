'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppShell, vendorTabs } from '@/components/app-shell'
import { CreateActionSheet } from '@/components/app-shell'
import { Image as ImageIcon, Layers as LayersIcon, Upload as UploadIcon } from 'lucide-react'

// ============================================================================
// Vendor App Layout
//
// Wraps all vendor app routes with the unified AppShell.
// Gated by NEXT_PUBLIC_APP_SHELL_ENABLED feature flag.
// When disabled, redirects to the old /vendor/dashboard.
// Auth is handled by the parent /vendor/layout.tsx (server component).
// ============================================================================

const APP_SHELL_ENABLED = process.env.NEXT_PUBLIC_APP_SHELL_ENABLED !== 'false'

export default function VendorAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [ready, setReady] = useState(APP_SHELL_ENABLED)

  useEffect(() => {
    if (!APP_SHELL_ENABLED) {
      router.replace('/vendor/dashboard')
    }
  }, [router])

  if (!ready) return null

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
              setCreateSheetOpen(false)
              router.push('/vendor/dashboard/products/create')
            },
          },
          {
            id: 'series',
            label: 'New Series',
            description: 'Organize artworks into a series',
            icon: <LayersIcon className="w-6 h-6" />,
            onClick: () => {
              setCreateSheetOpen(false)
              router.push('/vendor/dashboard/series/create')
            },
          },
          {
            id: 'media',
            label: 'Upload Media',
            description: 'Add images, video, or audio to your library',
            icon: <UploadIcon className="w-6 h-6" />,
            onClick: () => {
              setCreateSheetOpen(false)
              router.push('/vendor/dashboard/media-library?upload=true')
            },
          },
        ]}
      />
    </AppShell>
  )
}
