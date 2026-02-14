'use client'

import { ContentCard } from '@/components/app-shell'
import { Lock } from 'lucide-react'

// ============================================================================
// Collector Hidden Content Page
// ============================================================================

export default function CollectorHiddenContentPage() {
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-heading font-semibold text-gray-900 mb-4">Hidden Content</h1>
      <ContentCard padding="lg">
        <div className="text-center py-8">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 font-body">No hidden content unlocked yet</p>
          <p className="text-xs text-gray-400 font-body mt-1">
            Authenticate artworks and complete series to unlock exclusive content
          </p>
        </div>
      </ContentCard>
    </div>
  )
}
