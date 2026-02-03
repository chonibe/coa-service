import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  getProducts,
  getCollection,
  getCollections,
  formatPrice,
  isOnSale,
  getDiscountPercentage,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import {
  Container,
  GridContainer,
  SectionWrapper,
  SectionHeader,
  ProductCard,
  Badge,
  ProductBadge,
  Button,
  Select,
} from '@/components/impact'
import { ShopFilters } from './components/ShopFilters'
import { ProductCardItem } from './components/ProductCardItem'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Shop | Street Collector',
  description: 'Browse our collection of limited edition artworks for the Street Lamp.',
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

// =============================================================================
// TYPES
// =============================================================================

interface ShopPageProps {
  searchParams: Promise<{
    collection?: string
    sort?: string
    page?: string
  }>
}

// =============================================================================
// SHOP PAGE
// =============================================================================

export default async function ShopPage({ searchParams }: ShopPageProps) {
  // In Next.js 15+, searchParams is a Promise that must be awaited
  const params = await searchParams
  const { collection: collectionHandle, sort = 'best-selling', page = '1' } = params
  const currentPage = parseInt(page, 10) || 1
  const productsPerPage = 12

  // Determine sort key for Shopify API
  const sortKeyMap: Record<string, { key: 'TITLE' | 'PRICE' | 'BEST_SELLING' | 'CREATED_AT'; reverse: boolean }> = {
    'best-selling': { key: 'BEST_SELLING', reverse: false },
    'newest': { key: 'CREATED_AT', reverse: true },
    'price-low': { key: 'PRICE', reverse: false },
    'price-high': { key: 'PRICE', reverse: true },
    'title-az': { key: 'TITLE', reverse: false },
    'title-za': { key: 'TITLE', reverse: true },
  }
  const sortConfig = sortKeyMap[sort] || sortKeyMap['best-selling']

  // Fetch products with error handling
  let products: ShopifyProduct[] = []
  let hasNextPage = false
  let title = 'All Artworks'
  let collectionImage: string | null = null
  let collectionDescription: string | null = null
  let collections: { handle: string; title: string }[] = []
  let apiError: string | null = null

  try {
    if (collectionHandle) {
      const collection = await getCollection(collectionHandle, {
        first: productsPerPage,
        sortKey: sortConfig.key as any,
        reverse: sortConfig.reverse,
      })
      if (collection) {
        products = collection.products.edges.map(edge => edge.node)
        hasNextPage = collection.products.pageInfo.hasNextPage
        title = collection.title
        // Get collection image if available
        collectionImage = collection.image?.url || null
        collectionDescription = collection.description || null
      }
    } else {
      const result = await getProducts({
        first: productsPerPage,
        sortKey: sortConfig.key,
        reverse: sortConfig.reverse,
      })
      products = result.products
      hasNextPage = result.pageInfo.hasNextPage
    }

    // Fetch collections for filter dropdown
    const collectionsResult = await getCollections({ first: 50 })
    collections = collectionsResult.collections.map(c => ({ handle: c.handle, title: c.title }))
  } catch (error: any) {
    console.error('Error fetching shop data:', error)
    apiError = error.message || 'Failed to load products. Please check your Storefront API configuration.'
  }

  // Show error state if API failed
  if (apiError) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md" background="default">
          <Container maxWidth="default">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f83a3a]/10 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f83a3a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-4">
                Shop Unavailable
              </h1>
              <p className="text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
                Unable to load products from the store. This may be due to a configuration issue with the Shopify Storefront API.
              </p>
              <p className="text-sm text-[#f83a3a] mb-6 font-mono bg-[#f83a3a]/5 py-2 px-4 rounded-lg inline-block">
                {apiError}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link href="/">
                  <Button variant="primary">Go Home</Button>
                </Link>
                <Link href="/shop">
                  <Button variant="outline">Try Again</Button>
                </Link>
              </div>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Collection Header with Image (for collection pages) */}
      {collectionHandle && collectionImage && (
        <div className="relative h-48 sm:h-64 lg:h-80 overflow-hidden bg-[#f5f5f5]">
          <img
            src={collectionImage}
            alt={title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-end justify-center pb-8">
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-[-0.02em] text-center">
              {title}
            </h1>
          </div>
        </div>
      )}

      {/* Page Header (for non-collection pages or collections without images) */}
      {(!collectionHandle || !collectionImage) && (
        <SectionWrapper spacing="sm" background="default">
          <Container maxWidth="default">
            <div className="text-center py-4 sm:py-8">
              <p className="text-sm uppercase tracking-wider text-[#1a1a1a]/50 mb-2">
                Products
              </p>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#1a1a1a] tracking-[-0.02em]">
                {title}
              </h1>
            </div>
          </Container>
        </SectionWrapper>
      )}

      {/* Back link for collection pages */}
      {collectionHandle && (
        <SectionWrapper spacing="none" paddingX="gutter" background="default">
          <Container maxWidth="default">
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 py-2 text-sm text-[#2c4bce] hover:underline"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to all artworks
            </Link>
          </Container>
        </SectionWrapper>
      )}

      {/* Filters & Sort */}
      <SectionWrapper spacing="none" paddingX="gutter" background="default">
        <Container maxWidth="default">
          <ShopFilters
            collections={collections}
            currentCollection={collectionHandle}
            currentSort={sort}
            productCount={products.length}
          />
        </Container>
      </SectionWrapper>

      {/* Product Grid - 2 cols mobile, 3 cols desktop */}
      <SectionWrapper spacing="md" background="default">
        <Container maxWidth="default">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-[#1a1a1a]/60">No artworks found.</p>
              <Link href="/shop" className="mt-4 inline-block">
                <Button variant="outline">View All Artworks</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Product grid: 2 cols on mobile, 3 on desktop (matching live site) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={cn(
                      'animate-fade-in-up',
                      index % 3 === 1 && 'animate-fade-in-up-delay-1',
                      index % 3 === 2 && 'animate-fade-in-up-delay-2'
                    )}
                  >
                    <ProductCardItem product={product} />
                  </div>
                ))}
              </div>

              {/* Pagination - styled with Previous/Next buttons */}
              {(hasNextPage || currentPage > 1) && (
                <div className="flex items-center justify-center gap-2 sm:gap-4 mt-10 sm:mt-12 pt-8 border-t border-[#1a1a1a]/10">
                  {currentPage > 1 ? (
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(collectionHandle ? { collection: collectionHandle } : {}),
                        sort,
                        page: String(currentPage - 1),
                      }).toString()}`}
                      className="inline-flex items-center gap-1 px-4 sm:px-6 py-2.5 text-sm font-medium text-[#1a1a1a] border border-[#1a1a1a]/20 rounded-full hover:border-[#1a1a1a]/40 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:inline">Previous</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-4 sm:px-6 py-2.5 text-sm font-medium text-[#1a1a1a]/30 border border-[#1a1a1a]/10 rounded-full cursor-not-allowed">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="hidden sm:inline">Previous</span>
                    </span>
                  )}
                  
                  <span className="text-sm text-[#1a1a1a]/60 px-2">
                    Page {currentPage}
                  </span>
                  
                  {hasNextPage ? (
                    <Link
                      href={`/shop?${new URLSearchParams({
                        ...(collectionHandle ? { collection: collectionHandle } : {}),
                        sort,
                        page: String(currentPage + 1),
                      }).toString()}`}
                      className="inline-flex items-center gap-1 px-4 sm:px-6 py-2.5 text-sm font-medium text-[#1a1a1a] border border-[#1a1a1a]/20 rounded-full hover:border-[#1a1a1a]/40 transition-colors"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-4 sm:px-6 py-2.5 text-sm font-medium text-[#1a1a1a]/30 border border-[#1a1a1a]/10 rounded-full cursor-not-allowed">
                      <span className="hidden sm:inline">Next</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </SectionWrapper>
    </main>
  )
}

// ProductCardItem is now a client component in ./components/ProductCardItem.tsx
