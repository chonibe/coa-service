/**
 * VinylProductCard — Enriched (Track B3)
 * 
 * A shop product card with vinyl record-inspired interactions.
 * This is a shop-specific wrapper around the vinyl card system.
 * 
 * Features:
 * - 3D tilt effect on hover
 * - Flip to see artist notes (B-side)
 * - Quick add to cart
 * - Sale/stock badges
 * - Series indicator badge ("1 of 5") — NEW
 * - Artist avatar thumbnail — NEW
 * - "In your collection" indicator — NEW
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { VinylArtworkCard } from '@/components/vinyl'
import { Badge, ProductBadge } from '@/components/impact'
import { WishlistButton } from '@/components/shop/WishlistButton'
import { 
  formatPrice, 
  isOnSale, 
  getDiscountPercentage,
  type ShopifyProduct 
} from '@/lib/shopify/storefront-client'

export interface VinylProductCardProps {
  product: ShopifyProduct
  onQuickAdd?: (product: ShopifyProduct) => void
  quickAddLoading?: boolean
  /** Whether to enable flip interaction */
  enableFlip?: boolean
  /** Whether to enable tilt interaction */
  enableTilt?: boolean
  /** Series info for this product (e.g. "1 of 5") */
  seriesInfo?: {
    name: string
    position: number
    totalArtworks: number
  } | null
  /** Artist avatar URL from vendor profile_image */
  artistAvatarUrl?: string | null
  /** Whether this product is in the collector's collection */
  isInCollection?: boolean
  className?: string
}

export function VinylProductCard({
  product,
  onQuickAdd,
  quickAddLoading = false,
  enableFlip = true,
  enableTilt = true,
  seriesInfo,
  artistAvatarUrl,
  isInCollection = false,
  className,
}: VinylProductCardProps) {
  const price = formatPrice(product.priceRange.minVariantPrice)
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
    ? formatPrice(product.compareAtPriceRange.minVariantPrice)
    : undefined
  const onSale = isOnSale(product)
  const discount = onSale ? getDiscountPercentage(product) : 0
  
  // Get images for hover effect
  const images = product.images?.edges?.map(e => e.node) || []
  const secondImage = images[1]?.url

  // Check if product is new (created in last 30 days)
  const createdDate = new Date(product.createdAt || '')
  const isNew = (Date.now() - createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000
  
  // Check stock level - safely handle missing variants
  const firstVariant = product.variants?.edges?.[0]?.node
  const inventoryQuantity = (firstVariant as any)?.inventoryQuantity ?? null
  const isLowStock = inventoryQuantity !== null && inventoryQuantity > 0 && inventoryQuantity <= 5

  // Get artist notes from metafields if available
  const artistNotes = (product as any).metafields?.find(
    (m: any) => m?.key === 'artist_notes' || m?.key === 'artist_statement'
  )?.value || null

  // Build series name for the card (e.g., "1 of 5")
  const seriesDisplayName = seriesInfo
    ? `${seriesInfo.name} (${seriesInfo.position} of ${seriesInfo.totalArtworks})`
    : undefined

  // Build badges
  const badges = (
    <>
      {!product.availableForSale && (
        <ProductBadge type="sold-out" />
      )}
      {product.availableForSale && onSale && (
        <ProductBadge type="sale" discount={discount} />
      )}
      {product.availableForSale && !onSale && isNew && (
        <Badge variant="new">New</Badge>
      )}
      {product.availableForSale && isLowStock && (
        <Badge variant="warning">Only {inventoryQuantity} left</Badge>
      )}
      {/* Series indicator badge */}
      {seriesInfo && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#2c4bce]/90 text-white text-[10px] font-semibold rounded-full backdrop-blur-sm">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {seriesInfo.position} of {seriesInfo.totalArtworks}
        </span>
      )}
      {/* In your collection indicator */}
      {isInCollection && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0a8754]/90 text-white text-[10px] font-semibold rounded-full backdrop-blur-sm">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          In Collection
        </span>
      )}
    </>
  )

  const handleQuickAdd = () => {
    if (!quickAddLoading && product.availableForSale) {
      onQuickAdd?.(product)
    }
  }

  return (
    <div className={cn('relative group/card', className)}>
      {/* Wishlist button overlay (top-left) */}
      <div
        data-no-flip
        className="absolute top-2 left-2 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200"
      >
        <WishlistButton
          productId={product.id}
          variantId={firstVariant?.id || product.id}
          handle={product.handle}
          title={product.title}
          price={parseFloat(product.priceRange.minVariantPrice.amount)}
          image={product.featuredImage?.url}
          artistName={product.vendor}
          size="sm"
        />
      </div>

      {/* Artist avatar overlay (top-right, small circular) */}
      {artistAvatarUrl && (
        <div className="absolute top-2 right-2 z-20">
          <Link
            href={`/shop/artists/${encodeURIComponent(product.vendor?.toLowerCase().replace(/\s+/g, '-') || '')}`}
            className="block w-8 h-8 rounded-full overflow-hidden ring-2 ring-white shadow-md hover:ring-[#f0c417] transition-all"
            title={product.vendor}
          >
            <img
              src={artistAvatarUrl}
              alt={product.vendor || 'Artist'}
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      )}

      <VinylArtworkCard
        title={product.title}
        price={price}
        compareAtPrice={onSale ? compareAtPrice : undefined}
        image={product.featuredImage?.url || ''}
        secondImage={secondImage}
        imageAlt={product.featuredImage?.altText || product.title}
        href={`/shop/${product.handle}`}
        artistName={product.vendor}
        artistNotes={artistNotes}
        seriesName={seriesDisplayName}
        badges={badges}
        available={product.availableForSale}
        showQuickAdd={product.availableForSale && !!onQuickAdd}
        onQuickAdd={handleQuickAdd}
        quickAddLoading={quickAddLoading}
        disableFlip={!enableFlip || !artistNotes}
        disableTilt={!enableTilt}
        variant="shop"
      />
    </div>
  )
}
