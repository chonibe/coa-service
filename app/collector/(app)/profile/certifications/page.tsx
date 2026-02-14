'use client'

import { ContentCard } from '@/components/app-shell'
import { Shield } from 'lucide-react'

// ============================================================================
// Collector Certifications Page
// ============================================================================

export default function CollectorCertificationsPage() {
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-heading font-semibold text-gray-900 mb-4">Certifications</h1>
      <ContentCard padding="lg">
        <div className="text-center py-8">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 font-body">No certifications yet</p>
          <p className="text-xs text-gray-400 font-body mt-1">
            Authenticate your artworks with NFC to get certificates
          </p>
        </div>
      </ContentCard>
    </div>
  )
}
