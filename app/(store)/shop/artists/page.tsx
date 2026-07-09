'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
  SectionHeader,
} from '@/components/impact'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { artistPortraitCoverStyle } from '@/lib/shopify/artist-collection-image'
import { getStorePageContent } from '@/lib/content/site-content'

/**
 * Artists Listing Page
 * 
 * Displays all artists/vendors with their profile images.
 */

interface Artist {
  name: string
  slug: string
  productCount: number
  image?: string
  imageObjectPosition?: string
}

const artistsContent = getStorePageContent('artists')

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchArtists() {
      try {
        const response = await fetch('/api/shop/artists')
        if (response.ok) {
          const data = await response.json()
          setArtists(data.artists || [])
        }
      } catch (error) {
        console.error('Error fetching artists:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArtists()
  }, [])
  
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <SectionWrapper spacing="lg" background="default">
          <Container maxWidth="default">
            <div className="animate-pulse space-y-8">
              <div className="h-12 bg-muted rounded w-1/3 mx-auto" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-muted rounded-full" />
                    <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-background">
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="default">
          <SectionHeader
            title={artistsContent.hero.title}
            subtitle={artistsContent.hero.subtitle}
            alignment="center"
          />
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-12">
            {artists.map((artist) => (
              <Link
                key={artist.slug}
                href={`/shop/artists/${artist.slug}`}
                className="group text-center"
              >
                {/* Artist Image */}
                <div className="aspect-square rounded-full overflow-hidden bg-muted mb-4 mx-auto max-w-[200px] ring-4 ring-transparent group-hover:ring-[#f0c417]/50 transition-all duration-300">
                  {artist.image ? (
                    <img
                      src={getProxiedImageUrl(artist.image)}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                      style={artistPortraitCoverStyle(artist.imageObjectPosition)}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#390000] to-[#5a1a1a]">
                      <span className="text-4xl font-heading font-bold text-[#ffba94]">
                        {artist.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Artist Name */}
                <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-experience-highlight transition-colors">
                  {artist.name}
                </h3>
                
                {/* Artwork Count */}
                <p className="text-sm text-muted-foreground mt-1">
                  {artist.productCount} {artist.productCount === 1 ? artistsContent.counts.artwork : artistsContent.counts.artworks}
                </p>
              </Link>
            ))}
          </div>
          
          {artists.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{artistsContent.counts.empty}</p>
            </div>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
