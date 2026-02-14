'use client'

import { AppShell, collectorTabs, vendorTabs } from '@/components/app-shell'
import { CreateActionSheet } from '@/components/app-shell'
import { useState } from 'react'

/**
 * Dev-only preview of the app shell (no auth required).
 * http://localhost:3000/dev/app-preview
 */
export default function DevAppPreviewPage() {
  const [role, setRole] = useState<'collector' | 'vendor'>('collector')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <AppShell
      tabs={role === 'collector' ? collectorTabs : vendorTabs}
      headerProps={{
        showCart: role === 'collector',
        cartCount: 3,
        notificationCount: 2,
        logoHref: '/dev/app-preview',
      }}
      onCreatePress={role === 'vendor' ? () => setCreateOpen(true) : undefined}
    >
      {/* Role switcher for dev */}
      <div className="sticky top-14 z-20 -mx-4 px-4 py-2 bg-amber-100 border-b border-amber-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-800">Dev Preview (no auth)</span>
          <div className="flex gap-2">
            <button
              onClick={() => setRole('collector')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === 'collector'
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-amber-200 text-amber-800'
              }`}
            >
              Collector
            </button>
            <button
              onClick={() => setRole('vendor')}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                role === 'vendor'
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-amber-200 text-amber-800'
              }`}
            >
              Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <h1 className="text-impact-h3 font-heading tracking-tight text-gray-900">
          {role === 'collector' ? 'Collector' : 'Vendor'} App Preview
        </h1>
        <p className="text-sm text-gray-500 font-body">
          This is a dev-only route. No login required. Switch roles above to preview both shells.
        </p>
        <p className="text-xs text-gray-400 font-body">
          Try: /collector/home, /vendor/home for the real routes (auth required).
        </p>
      </div>

      {role === 'vendor' && (
        <CreateActionSheet
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
        />
      )}
    </AppShell>
  )
}
