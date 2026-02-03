'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { Container, SectionWrapper, Button, ProductCard, Badge } from '@/components/impact'
import { getSeriesDetails, getSeriesArtworks, type SeriesArtwork } from '@/lib/shop/series'
import { formatPrice } from '@/lib/shopify/storefront-client'
import { useCart } from '@/lib/shop/CartContext'

/**
 * Series Browse Page
 * 
 * Displays all artworks in a series with progress tracking.
 * Shows locked/unlocked states and collector progress.
 */

interface SeriesDetails {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
  vendor_name: string
  unlock_type: string
  total_artworks: number
}

export default function SeriesPage() {
  const params = useParams<{ seriesId: string }>()
  const cart = useCart()
  const [series, setSeries] = useState<SeriesDetails | null>(null)
  const [artworks, setArtworks] = useState<SeriesArtwork[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSeriesData() {
      if (!params?.seriesId) return

      try {
        const response = await fetch(`/api/shop/series/${params.seriesId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Series not found')
          } else {
            setError('Failed to load series')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setSeries(data.series)
        setArtworks(data.artworks || [])
      } catch (err) {
        console.error('Error fetching series:', err)
        setError('Failed to load series')
      } finally {
        setLoading(false)
      }
    }

    fetchSeriesData()
  }, [params?.seriesId])

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md">
          <Container maxWidth="default">
            <div className="animate-pulse space-y-8">
              <div className="h-32 bg-[#f5f5f5] rounded-[24px]" />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-[#f5f5f5] rounded-[24px]" />
                ))}
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  // Error state
  if (error || !series) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md">
          <Container maxWidth="default">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f83a3a]/10 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f83a3a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-2">
                {error || 'Series Not Found'}
              </h1>
              <p className="text-[#1a1a1a]/60 mb-6">
                The series you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/shop">
                <Button variant="primary">Back to Shop</Button>
              </Link>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  const availableCount = artworks.filter(a => !a.is_locked && a.shopify_product_id).length
  const lockedCount = artworks.filter(a => a.is_locked).length

  return (
    <main className="min-h-screen bg-white">
      {/* Series Header */}
      <SectionWrapper spacing="sm" background="muted">
        <Container maxWidth="default">
          <div className="py-8 sm:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-6">
              <Link href="/shop" className="text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors">
                Shop
              </Link>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[#1a1a1a]">Series</span>
            </div>

            <div className="flex items-start gap-6">
              {/* Series Thumbnail */}
              {series.thumbnail_url && (
                <div className="hidden sm:block flex-shrink-0 w-32 h-32 rounded-[16px] overflow-hidden bg-white shadow-md">
                  <img
                    src={series.thumbnail_url}
                    alt={series.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Series Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="primary">Series</Badge>
                  <span className="text-sm text-[#1a1a1a]/60">by {series.vendor_name}</span>
                </div>
                
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                  {series.name}
                </h1>

                {series.description && (
                  <p className="text-lg text-[#1a1a1a]/70 mb-4 max-w-3xl">
                    {series.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span className="font-medium text-[#1a1a1a]">
                      {series.total_artworks} Artwork{series.total_artworks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <span className="text-[#1a1a1a]/20">•</span>
                  
                  <div className="flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a8754" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span className="font-medium text-[#0a8754]">
                      {availableCount} Available
                    </span>
                  </div>

                  {lockedCount > 0 && (
                    <>
                      <span className="text-[#1a1a1a]/20">•</span>
                      <div className="flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0c417" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="font-medium text-[#f0c417]">
                          {lockedCount} Locked
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>

      {/* Artworks Grid */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          {artworks.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#1a1a1a]/60">No artworks in this series yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {artworks.map((artwork) => (
                <div key={artwork.id} className="relative">
                  {/* Locked Overlay */}
                  {artwork.is_locked && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-[24px] flex items-center justify-center">
                      <div className="text-center p-4">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#f0c417"
                          strokeWidth="2"
                          className="mx-auto mb-2"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <p className="text-sm font-medium text-[#1a1a1a]">Locked</p>
                        <p className="text-xs text-[#1a1a1a]/60 mt-1">Coming Soon</p>
                      </div>
                    </div>
                  )}

                  {/* Product Card */}
                  {artwork.shopify_product_id && artwork.handle && !artwork.is_locked ? (
                    <ProductCard
                      title={artwork.title}
                      price={artwork.price ? `$${artwork.price.toFixed(2)}` : 'Price TBA'}
                      image={artwork.image_url || ''}
                      imageAlt={artwork.title}
                      href={`/shop/${artwork.handle}`}
                      transparentBackground={true}
                      showQuickAdd={artwork.availability_status === 'available'}
                      onQuickAdd={() => {
                        // Quick add functionality
                        console.log('Quick add:', artwork.title)
                      }}
                    />
                  ) : (
                    // Placeholder for upcoming artwork
                    <div className="aspect-square rounded-[24px] bg-[#f5f5f5] overflow-hidden">
                      {artwork.image_url ? (
                        <img
                          src={artwork.image_url}
                          alt={artwork.title}
                          className="w-full h-full object-cover opacity-40"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#1a1a1a"
                            strokeWidth="1"
                            className="opacity-20"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
