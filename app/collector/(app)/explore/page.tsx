'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { Search, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Explore Tab — Phase 1.4
//
// API: /api/collector/marketplace?sort=newest
// Render: 2-column product grid, filter pills (artists, series, price range)
// Tap: Navigate to /shop/products/[handle]
// Old source: app/collector/discover/page.tsx
// ============================================================================

const exploreTabs: SubTab[] = [
  { id: 'discover', label: 'Discover', href: '/collector/explore' },
  { id: 'following', label: 'Following', href: '/collector/explore/following' },
]

interface MarketplaceProduct {
  id: string
  title: string
  handle: string
  price: number | null
  currency: string
  imageUrl: string | null
  vendorName: string
  isNew: boolean
  seriesName?: string
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [artists, setArtists] = useState<string[]>([])
  const [selectedArtist, setSelectedArtist] = useState<string>('all')

  useEffect(() => {
    async function fetchMarketplace() {
      try {
        const params = new URLSearchParams()
        params.set('sort', 'newest')
        if (selectedArtist !== 'all') params.set('artist', selectedArtist)
        if (searchQuery) params.set('search', searchQuery)

        const res = await fetch(`/api/collector/marketplace?${params.toString()}`)
        const json = await res.json()

        if (json.success || json.artworks) {
          setProducts(
            (json.artworks || []).map((a: any) => ({
              id: a.id,
              title: a.title,
              handle: a.handle || a.shopifyProductId,
              price: a.price,
              currency: a.currency || 'USD',
              imageUrl: a.images?.[0]?.src || null,
              vendorName: a.vendor?.name || '',
              isNew: a.isNew || false,
              seriesName: a.series?.name,
            }))
          )
          if (json.availableFilters?.artists) {
            setArtists(json.availableFilters.artists)
          }
        }
      } catch (err) {
        console.error('[Explore] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMarketplace()
  }, [selectedArtist, searchQuery])

  return (
    <div>
      <SubTabBar tabs={exploreTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search artworks, artists, series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-impact-block-sm text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20"
          />
        </div>

        {/* Artist filter pills */}
        {artists.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedArtist('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold font-body shrink-0 transition-all',
                selectedArtist === 'all'
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All Artists
            </button>
            {artists.map((artist) => (
              <button
                key={artist}
                onClick={() => setSelectedArtist(artist)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold font-body shrink-0 transition-all',
                  selectedArtist === artist
                    ? 'bg-[#390000] text-[#ffba94]'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {artist}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs" />
                <div className="h-3 bg-gray-100 rounded mt-2 w-3/4" />
                <div className="h-3 bg-gray-100 rounded mt-1 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No artworks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/shop/products/${product.handle}`}
                className="group"
              >
                <div className="relative aspect-[4/5] rounded-impact-block-xs overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  {product.isNew && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                      New
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-900 font-body truncate group-hover:text-impact-primary transition-colors">
                    {product.title}
                  </p>
                  <p className="text-[11px] text-gray-500 font-body truncate">
                    {product.vendorName}
                  </p>
                  {product.seriesName && (
                    <p className="text-[10px] text-impact-primary font-body truncate">
                      {product.seriesName}
                    </p>
                  )}
                  <span className="text-xs font-bold text-gray-900 font-body">
                    {product.price != null
                      ? `${product.currency} ${product.price.toFixed(2)}`
                      : 'Price TBA'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CollectorExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-center text-sm text-gray-400 font-body">
          Loading...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
