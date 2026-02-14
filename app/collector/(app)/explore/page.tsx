'use client'

import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { SubTabBar, type SubTab } from '@/components/app-shell'

// ============================================================================
// Collector Explore Tab
//
// Discover artists, series, and search.
// Pinterest-style masonry of artworks.
// Sub-tabs: Following / Discover
// ============================================================================

const exploreTabs: SubTab[] = [
  { id: 'discover', label: 'Discover', href: '/collector/explore' },
  { id: 'following', label: 'Following', href: '/collector/explore/following' },
]

export default function CollectorExplorePage() {
  return (
    <div>
      <SubTabBar tabs={exploreTabs} />

      <div className="px-4 py-4 space-y-6">
        {/* Search prompt */}
        <div className="text-center py-8">
          <h2 className="text-impact-h4 font-heading tracking-tight text-gray-900">
            Explore Art
          </h2>
          <p className="text-sm text-gray-500 font-body mt-1">
            Discover new artists, series, and artworks
          </p>
        </div>

        {/* Featured Artists */}
        <ContentCard
          padding="md"
          header={<ContentCardHeader title="Featured Artists" />}
        >
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm font-body">Artist discovery grid will appear here</p>
          </div>
        </ContentCard>

        {/* Trending Series */}
        <ContentCard
          padding="md"
          header={<ContentCardHeader title="Trending Series" />}
        >
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm font-body">Series cards will appear here</p>
          </div>
        </ContentCard>
      </div>
    </div>
  )
}
