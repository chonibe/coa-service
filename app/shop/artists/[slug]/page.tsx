'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
  Button,
  Badge,
} from '@/components/impact'
import { VinylProductCard } from '@/components/shop'
import { ScrollReveal } from '@/components/blocks'
import { useCart } from '@/lib/shop/CartContext'
import { type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getPage, hasPage } from '@/content/shopify-content'

/**
 * Artist/Vendor Profile Page — Enriched (Track B1)
 * 
 * Displays a rich artist profile merging Shopify and Supabase data:
 * - Hero with vendor profile_image
 * - Bio from database (not Shopify description)
 * - Instagram link + website
 * - Series grid with thumbnails
 * - "Collected by X collectors" social proof
 * - Full product grid with vinyl card interactions
 */

interface ArtistSeries {
  id: string
  name: string
  description: string | null
  thumbnail_url: string | null
}

interface ArtistProfile {
  name: string
  slug: string
  bio?: string
  artistHistory?: string
  image?: string
  signatureUrl?: string
  instagramUrl?: string
  website?: string
  products: ShopifyProduct[]
  series: ArtistSeries[]
  collectorCount: number
  vendorId?: number
}

export default function ArtistPage() {
  const params = useParams<{ slug: string }>()
  const cart = useCart()
  const [artist, setArtist] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  
  useEffect(() => {
    async function fetchArtist() {
      if (!params?.slug) return
      
      try {
        const response = await fetch(`/api/shop/artists/${params.slug}`)
        if (response.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        if (response.ok) {
          const data = await response.json()
          
          // Try to get bio from synced Shopify pages if database bio is empty
          let bio = data.bio
          if (!bio && hasPage(params.slug)) {
            const page = getPage(params.slug)
            if (page) {
              bio = page.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            }
          }
          
          setArtist({ ...data, bio })
        }
      } catch (error) {
        console.error('Error fetching artist:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchArtist()
  }, [params?.slug])
  
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="lg" background="default">
          <Container maxWidth="default">
            <div className="animate-pulse">
              {/* Hero skeleton */}
              <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                <div className="w-48 h-48 rounded-full bg-[#f5f5f5]" />
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="h-10 bg-[#f5f5f5] rounded w-1/2 mx-auto md:mx-0" />
                  <div className="h-4 bg-[#f5f5f5] rounded w-3/4 mx-auto md:mx-0" />
                  <div className="h-4 bg-[#f5f5f5] rounded w-2/3 mx-auto md:mx-0" />
                </div>
              </div>
              {/* Series skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-[#f5f5f5] rounded-[16px]" />
                ))}
              </div>
              {/* Grid skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-square bg-[#f5f5f5] rounded-[24px]" />
                    <div className="h-4 bg-[#f5f5f5] rounded w-3/4" />
                    <div className="h-4 bg-[#f5f5f5] rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }
  
  if (notFound || !artist) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="lg" background="default">
          <Container maxWidth="narrow">
            <div className="text-center py-12">
              <h1 className="font-heading text-3xl font-semibold text-[#1a1a1a] mb-4">
                Artist Not Found
              </h1>
              <p className="text-[#1a1a1a]/60 mb-8">
                We couldn&apos;t find an artist with that name.
              </p>
              <Link href="/shop/artists">
                <Button variant="primary">View All Artists</Button>
              </Link>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }
  
  return (
    <main className="min-h-screen bg-white">
      {/* ── Artist Hero Section ── */}
      <SectionWrapper spacing="lg" background="muted">
        <Container maxWidth="default">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm mb-8">
              <Link href="/shop" className="text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors">
                Shop
              </Link>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Link href="/shop/artists" className="text-[#1a1a1a]/60 hover:text-[#2c4bce] transition-colors">
                Artists
              </Link>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[#1a1a1a]">{artist.name}</span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden bg-[#f5f5f5] ring-4 ring-[#f0c417]/30 shadow-xl">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#390000] to-[#5a1a1a]">
                      <span className="text-6xl font-heading font-bold text-[#ffba94]">
                        {artist.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {/* Signature overlay */}
                {artist.signatureUrl && (
                  <div className="absolute -bottom-2 -right-2 w-20 h-14 opacity-70">
                    <img
                      src={artist.signatureUrl}
                      alt={`${artist.name} signature`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              
              {/* Artist Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                  {artist.name}
                </h1>
                
                {artist.bio && (
                  <p className="text-lg text-[#1a1a1a]/70 max-w-2xl leading-relaxed mb-6">
                    {artist.bio.length > 500 ? artist.bio.substring(0, 500) + '...' : artist.bio}
                  </p>
                )}
                
                {/* Stats + Social Links */}
                <div className="flex items-center flex-wrap gap-3 justify-center md:justify-start">
                  <span className="px-4 py-2 bg-[#f0c417]/10 rounded-full text-sm font-semibold text-[#1a1a1a]">
                    {artist.products.length} {artist.products.length === 1 ? 'Artwork' : 'Artworks'}
                  </span>
                  
                  {artist.series.length > 0 && (
                    <span className="px-4 py-2 bg-[#2c4bce]/10 rounded-full text-sm font-semibold text-[#2c4bce]">
                      {artist.series.length} {artist.series.length === 1 ? 'Series' : 'Series'}
                    </span>
                  )}
                  
                  {artist.collectorCount > 0 && (
                    <span className="px-4 py-2 bg-[#0a8754]/10 rounded-full text-sm font-semibold text-[#0a8754]">
                      Collected by {artist.collectorCount} {artist.collectorCount === 1 ? 'collector' : 'collectors'}
                    </span>
                  )}
                  
                  {/* Social Links */}
                  {artist.instagramUrl && (
                    <a
                      href={artist.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1a1a1a]/15 text-sm font-medium text-[#1a1a1a]/70 hover:border-[#E1306C] hover:text-[#E1306C] transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                      Instagram
                    </a>
                  )}
                  
                  {artist.website && (
                    <a
                      href={artist.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1a1a1a]/15 text-sm font-medium text-[#1a1a1a]/70 hover:border-[#2c4bce] hover:text-[#2c4bce] transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </SectionWrapper>

      {/* ── Artist History (expandable) ── */}
      {artist.artistHistory && (
        <SectionWrapper spacing="sm" background="default">
          <Container maxWidth="narrow">
            <ScrollReveal animation="fadeUp" delay={0.1}>
              <div className="prose prose-lg max-w-none text-[#1a1a1a]/70">
                <h2 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-4">
                  About {artist.name}
                </h2>
                <p className="leading-relaxed whitespace-pre-line">
                  {artist.artistHistory}
                </p>
              </div>
            </ScrollReveal>
          </Container>
        </SectionWrapper>
      )}

      {/* ── Series Grid ── */}
      {artist.series.length > 0 && (
        <SectionWrapper spacing="md" background="default">
          <Container maxWidth="default">
            <ScrollReveal animation="fadeUp" delay={0.1}>
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-6">
                Series
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {artist.series.map((series) => (
                  <Link
                    key={series.id}
                    href={`/shop/series/${series.id}`}
                    className="group relative overflow-hidden bg-gradient-to-br from-[#f5f5f5] to-[#fafafa] border border-[#1a1a1a]/10 rounded-[16px] p-5 hover:border-[#2c4bce]/30 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Series Thumbnail */}
                      {series.thumbnail_url ? (
                        <div className="flex-shrink-0 w-16 h-16 rounded-[12px] overflow-hidden bg-white shadow-sm">
                          <img
                            src={series.thumbnail_url}
                            alt={series.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 rounded-[12px] bg-[#2c4bce]/10 flex items-center justify-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c4bce" strokeWidth="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          </svg>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#2c4bce]/10 rounded-full mb-2">
                          <span className="text-xs font-medium text-[#2c4bce]">Series</span>
                        </div>
                        <h3 className="font-heading text-base font-semibold text-[#1a1a1a] group-hover:text-[#2c4bce] transition-colors truncate">
                          {series.name}
                        </h3>
                        {series.description && (
                          <p className="text-sm text-[#1a1a1a]/60 mt-1 line-clamp-2">
                            {series.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-2 text-sm font-medium text-[#2c4bce] group-hover:gap-2 transition-all">
                          <span>Browse Series</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-1">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </ScrollReveal>
          </Container>
        </SectionWrapper>
      )}
      
      {/* ── Artworks Grid ── */}
      <SectionWrapper spacing="md" background={artist.series.length > 0 ? 'muted' : 'default'}>
        <Container maxWidth="default">
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-8">
            Artworks
          </h2>
          
          {artist.products.length > 0 ? (
            <ScrollReveal animation="stagger" staggerAmount={0.1} delay={0.1}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {artist.products.map((product) => (
                  <VinylProductCard
                    key={product.id}
                    product={product}
                    artistAvatarUrl={artist.image}
                    onQuickAdd={(prod) => {
                      const variant = prod.variants.edges[0]?.node
                      if (variant) {
                        cart.addItem({
                          productId: prod.id,
                          variantId: variant.id,
                          handle: prod.handle,
                          title: prod.title,
                          price: parseFloat(variant.price.amount),
                          quantity: 1,
                          image: prod.featuredImage?.url,
                          artistName: prod.vendor,
                        })
                      }
                    }}
                    enableFlip={true}
                    enableTilt={true}
                  />
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal animation="fadeUp">
              <div className="text-center py-12">
                <p className="text-[#1a1a1a]/60">No artworks available yet</p>
              </div>
            </ScrollReveal>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
