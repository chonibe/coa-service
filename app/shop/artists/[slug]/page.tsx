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
import { useCart } from '@/lib/shop/CartContext'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Artist/Vendor Profile Page
 * 
 * Shows artist profile with their bio and all artworks.
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
          setArtist(data)
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
      {/* Artist Hero */}
      <SectionWrapper spacing="lg" background="default">
        <Container maxWidth="default">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
            {/* Profile Image */}
            <div className="w-48 h-48 rounded-full overflow-hidden bg-[#f5f5f5] flex-shrink-0 ring-4 ring-[#f0c417]/30">
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
                  {artist.bio}
                </p>
              )}
              
              <p className="mt-4 text-[#1a1a1a]/60">
                {artist.products.length} {artist.products.length === 1 ? 'artwork' : 'artworks'} available
              </p>
            </div>
          </div>
          
          {/* Artworks Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {artist.products.map((product) => {
              const images = product.images?.edges?.map(e => e.node) || []
              const secondImage = images[1]?.url
              
              return (
                <ProductCard
                  key={product.id}
                  title={product.title}
                  price={formatPrice(product.priceRange.minVariantPrice)}
                  image={product.featuredImage?.url || ''}
                  secondImage={secondImage}
                  imageAlt={product.featuredImage?.altText || product.title}
                  href={`/shop/${product.handle}`}
                  transparentBackground={true}
                  showQuickAdd={true}
                  onQuickAdd={() => {
                    const variant = product.variants.edges[0]?.node
                    if (variant) {
                      cart.addItem({
                        productId: product.id,
                        variantId: variant.id,
                        handle: product.handle,
                        title: product.title,
                        price: parseFloat(variant.price.amount),
                        quantity: 1,
                        image: product.featuredImage?.url,
                        artistName: product.vendor,
                      })
                    }
                  }}
                />
              )
            })}
          </div>
          
          {artist.products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#1a1a1a]/60">No artworks available yet</p>
            </div>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}
