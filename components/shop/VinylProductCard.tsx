/**
 * VinylProductCard
 * 
 * A shop product card with vinyl record-inspired interactions.
 * This is a shop-specific wrapper around the vinyl card system.
 * 
 * Features:
 * - 3D tilt effect on hover
 * - Flip to see artist notes (B-side)
 * - Quick add to cart
 * - Sale/stock badges
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { VinylArtworkCard } from '@/components/vinyl'
import { Badge, ProductBadge } from '@/components/impact'
import { 
  formatPrice, 
  isOnSale, 
  getDiscountPercentage,
  type ShopifyProduct 
} from '@/lib/shopify/storefront-client'
import { trackViewItem, type AnalyticsStage } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'

export interface VinylProductCardProps {
  product: ShopifyProduct
  onQuickAdd?: (product: ShopifyProduct) => void
  quickAddLoading?: boolean
  /** Whether to enable flip interaction */
  enableFlip?: boolean
  /** Whether to enable tilt interaction */
  enableTilt?: boolean
  className?: string
  /** Stage/source for analytics (view_item): home | products | artist | pdp | experience */
  trackStage?: AnalyticsStage
  /** Whether to show early access badge */
  isEarlyAccess?: boolean
}

export function VinylProductCard({
  product,
  onQuickAdd,
  quickAddLoading = false,
  enableFlip = true,
  enableTilt = false,
  className,
  trackStage,
  isEarlyAccess = false,
}: VinylProductCardProps) {
  // Calculate early access discount (10% off)
  const originalPriceAmount = parseFloat(product.priceRange.minVariantPrice.amount)
  const earlyAccessDiscountPercent = isEarlyAccess ? 10 : 0
  const earlyAccessDiscountedAmount = isEarlyAccess 
    ? Math.round(originalPriceAmount * (1 - earlyAccessDiscountPercent / 100) * 100) / 100
    : originalPriceAmount

  // Use early access discounted price if active, otherwise use original price
  const displayPrice = isEarlyAccess
    ? formatPrice({ 
        ...product.priceRange.minVariantPrice, 
        amount: earlyAccessDiscountedAmount.toFixed(2),
        currencyCode: product.priceRange.minVariantPrice.currencyCode
      })
    : formatPrice(product.priceRange.minVariantPrice)
  
  // Show original price as compareAtPrice when early access is active
  const compareAtPrice = isEarlyAccess
    ? formatPrice(product.priceRange.minVariantPrice)
    : (product.compareAtPriceRange?.minVariantPrice?.amount
        ? formatPrice(product.compareAtPriceRange.minVariantPrice)
        : undefined)
  
  const onSale = isOnSale(product)
  const discount = onSale ? getDiscountPercentage(product) : (isEarlyAccess ? earlyAccessDiscountPercent : 0)
  
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

  // Build badges
  const badges = (
    <>
      {!product.availableForSale && (
        <ProductBadge type="sold-out" />
      )}
      {product.availableForSale && isEarlyAccess && (
        <Badge variant="new" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
          Early Access
        </Badge>
      )}
      {product.availableForSale && onSale && (
        <ProductBadge type="sale" discount={discount} />
      )}
      {product.availableForSale && !onSale && isNew && !isEarlyAccess && (
        <Badge variant="new">New</Badge>
      )}
      {product.availableForSale && isLowStock && (
        <Badge variant="warning">Only {inventoryQuantity} left</Badge>
      )}
    </>
  )

  const handleQuickAdd = () => {
    if (!quickAddLoading && product.availableForSale) {
      onQuickAdd?.(product)
    }
  }

  return (
    <VinylArtworkCard
      title={product.title}
      price={displayPrice}
      compareAtPrice={isEarlyAccess ? compareAtPrice : (onSale ? compareAtPrice : undefined)}
      image={product.featuredImage?.url || ''}
      secondImage={secondImage}
      imageAlt={product.featuredImage?.altText || product.title}
      href={`/shop/${product.handle}`}
      artistName={product.vendor}
      artistNotes={artistNotes}
      badges={badges}
      available={product.availableForSale}
      showQuickAdd={product.availableForSale && !!onQuickAdd}
      onQuickAdd={handleQuickAdd}
      quickAddLoading={quickAddLoading}
      disableFlip={!enableFlip || !artistNotes}
      disableTilt={!enableTilt}
      variant="shop"
      className={className}
      onCardClick={() => trackViewItem({ ...storefrontProductToItem(product, firstVariant ?? undefined, 1), ...(trackStage && { item_list_name: trackStage }) })}
    />
  )
}
