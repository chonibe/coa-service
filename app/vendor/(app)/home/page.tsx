'use client'

import { ContentCard, ContentCardHeader } from '@/components/app-shell'

// ============================================================================
// Vendor Home Tab
//
// Shop feed with your artwork performance pinned at top.
// See your work live alongside other artworks.
// ============================================================================

export default function VendorHomePage() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Quick stats */}
      <div>
        <h1 className="text-impact-h3 md:text-impact-h3-lg font-heading tracking-tight text-gray-900">
          Your Studio
        </h1>
        <p className="text-sm text-gray-500 font-body mt-1">
          See how your artworks are performing in the shop.
        </p>
      </div>

      {/* Your Artworks Performance */}
      <ContentCard
        padding="md"
        header={
          <ContentCardHeader
            title="Your Artworks"
            description="Live performance in the shop"
          />
        }
      >
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-body">Your artwork cards with live stats will appear here</p>
        </div>
      </ContentCard>

      {/* Shop Feed */}
      <ContentCard
        padding="md"
        header={
          <ContentCardHeader
            title="Shop Feed"
            description="Latest artworks from all artists"
          />
        }
      >
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-body">Shop feed will appear here</p>
        </div>
      </ContentCard>
    </div>
  )
}
