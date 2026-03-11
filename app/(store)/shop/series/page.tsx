'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
  SectionHeader,
  Button,
  Badge,
} from '@/components/impact'
import { ScrollReveal } from '@/components/blocks'

/**
 * Series Listing Page — Track B2
 * 
 * Displays all active artwork series with thumbnails.
 * For logged-in collectors: shows progress indicators.
 */

interface SeriesItem {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  vendor_name: string
  unlock_type: string
  total_artworks: number
  release_date: string | null
  genre_tags: string[] | null
  collector_progress: {
    owned_count: number
    total_artworks: number
    owned_percentage: number
  } | null
}

export default function SeriesListingPage() {
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeries() {
      try {
        const response = await fetch('/api/shop/series')
        if (response.ok) {
          const data = await response.json()
          setSeriesList(data.series || [])
        }
      } catch (error) {
        console.error('Error fetching series:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSeries()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="lg" background="default">
          <Container maxWidth="default">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-[#f5f5f5] rounded w-1/3 mx-auto" />
              <div className="h-6 bg-[#f5f5f5] rounded w-2/3 mx-auto" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 bg-[#f5f5f5] rounded-[24px]" />
                ))}
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <SectionWrapper spacing="lg" background="muted">
        <Container maxWidth="default">
          <SectionHeader
            title="Artwork Series"
            subtitle="Explore curated collections of artworks. Collect a complete series to unlock exclusive rewards."
            alignment="center"
          />
        </Container>
      </SectionWrapper>

      {/* Series Grid */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          {seriesList.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#047AFF]/10 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#047AFF" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <h2 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-2">
                No Series Available
              </h2>
              <p className="text-[#1a1a1a]/60 mb-6">
                Check back soon for new artwork series.
              </p>
              <Link href="/shop">
                <Button variant="primary">Browse Artworks</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seriesList.map((series, index) => (
                <ScrollReveal
                  key={series.id}
                  animation="fadeUp"
                  delay={index * 0.08}
                  duration={0.5}
                >
                  <SeriesCard series={series} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}

function SeriesCard({ series }: { series: SeriesItem }) {
  const hasProgress = series.collector_progress && series.collector_progress.owned_count > 0
  const isComplete = series.collector_progress?.owned_percentage === 100

  return (
    <Link
      href={`/shop/series/${series.id}`}
      className="group block overflow-hidden bg-white border border-[#1a1a1a]/10 rounded-[24px] hover:border-[#047AFF]/30 hover:shadow-lg transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f5f5f5]">
        {series.thumbnail_url ? (
          <img
            src={series.thumbnail_url}
            alt={series.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5]">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="1" className="opacity-20">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="primary">
            {series.total_artworks} {series.total_artworks === 1 ? 'Artwork' : 'Artworks'}
          </Badge>
          {isComplete && (
            <Badge variant="success">Complete!</Badge>
          )}
        </div>

        {/* Progress indicator overlay */}
        {hasProgress && !isComplete && series.collector_progress && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0cc46e] rounded-full transition-all duration-500"
                  style={{ width: `${series.collector_progress.owned_percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-white">
                {series.collector_progress.owned_count}/{series.collector_progress.total_artworks}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-[#1a1a1a]/50 uppercase tracking-wider">
            {series.vendor_name}
          </span>
        </div>

        <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] mb-2 group-hover:text-[#047AFF] transition-colors">
          {series.name}
        </h3>

        {series.description && (
          <p className="text-sm text-[#1a1a1a]/60 line-clamp-2 mb-4">
            {series.description}
          </p>
        )}

        {/* Tags */}
        {series.genre_tags && series.genre_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {series.genre_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-[#1a1a1a]/5 rounded-full text-[#1a1a1a]/60"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-[#047AFF] group-hover:gap-2.5 transition-all">
          <span>
            {hasProgress ? 'Continue Collecting' : 'Explore Series'}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform group-hover:translate-x-1"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
