'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
  ProductCard,
  Button,
} from '@/components/impact'
import { ImageWithTextOverlay } from '@/components/sections'
import { VinylProductCard } from '@/components/shop'
import { ScrollReveal, ParallaxLayer } from '@/components/blocks'
import { useCart } from '@/lib/shop/CartContext'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import { getPage, hasPage } from '@/content/shopify-content'

/**
 * Artist/Vendor Profile Page
 * 
 * Enhanced with vinyl record-inspired interactions:
 * - Artist bio from synced Shopify page content
 * - Artworks displayed as VinylArtworkCard grid with 3D tilt
 * - GSAP scroll-triggered stagger animations
 */

interface ArtistProfile {
  name: string
  slug: string
  bio?: string
  image?: string
  products: ShopifyProduct[]
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
          
          // Try to get bio from synced Shopify pages
          let bio = data.bio
          if (!bio && hasPage(params.slug)) {
            const page = getPage(params.slug)
            if (page) {
              // Extract plain text from HTML body
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
                We couldn't find an artist with that name.
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
      {/* Artist Hero with Parallax */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="default">
          <ScrollReveal animation="fadeUp" duration={0.8}>
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
              {/* Profile Image */}
              <div className="w-48 h-48 rounded-full overflow-hidden bg-[#f5f5f5] flex-shrink-0 ring-4 ring-[#f0c417]/30 shadow-xl">
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
              
              {/* Artist Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                  {artist.name}
                </h1>
                
                {artist.bio && (
                  <p className="text-lg text-[#1a1a1a]/70 max-w-2xl leading-relaxed">
                    {artist.bio.length > 300 ? artist.bio.substring(0, 300) + '...' : artist.bio}
                  </p>
                )}
                
                <div className="mt-6 flex items-center gap-3 justify-center md:justify-start">
                  <span className="px-4 py-2 bg-[#f0c417]/10 rounded-full text-sm font-semibold text-[#1a1a1a]">
                    {artist.products.length} {artist.products.length === 1 ? 'Artwork' : 'Artworks'}
                  </span>
                  <Link 
                    href={`/shop?collection=${artist.slug}`}
                    className="text-sm text-[#2c4bce] hover:underline"
                  >
                    View in Shop →
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
          
          {/* Artworks Grid - Vinyl Cards with Scroll Stagger */}
          {artist.products.length > 0 ? (
            <ScrollReveal animation="stagger" staggerAmount={0.15} delay={0.2}>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {artist.products.map((product) => (
                  <VinylProductCard
                    key={product.id}
                    product={product}
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
