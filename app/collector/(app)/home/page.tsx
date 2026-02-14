'use client'

import { ContentCard, ContentCardHeader } from '@/components/app-shell'

// ============================================================================
// Collector Home Tab
//
// The shop feed — personalized for the collector.
// Shows artworks, new releases, recommendations based on collection.
// Reuses shop product cards and feed components.
// ============================================================================

export default function CollectorHomePage() {
  return (
    <div className="px-4 py-4 space-y-6">
      {/* Personalized greeting */}
      <div>
        <h1 className="text-impact-h3 md:text-impact-h3-lg font-heading tracking-tight text-gray-900">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 font-body mt-1">
          Discover new artworks and see what your artists are creating.
        </p>
      </div>

      {/* New Releases Section */}
      <ContentCard
        padding="md"
        header={
          <ContentCardHeader
            title="New Releases"
            description="Fresh artworks from artists you follow"
          />
        }
      >
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-body">Shop feed will appear here</p>
          <p className="text-xs mt-1">Personalized product cards from the shop</p>
        </div>
      </ContentCard>

      {/* Recommended For You */}
      <ContentCard
        padding="md"
        header={
          <ContentCardHeader
            title="Recommended For You"
            description="Based on your collection"
          />
        }
      >
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm font-body">Recommendations will appear here</p>
        </div>
      </ContentCard>
    </div>
  )
}
