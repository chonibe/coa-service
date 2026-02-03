'use client'

import { ProductCard, ProductBadge, Badge } from '@/components/impact'
import { VinylArtworkCard } from '@/components/vinyl'
import { useCart } from '@/lib/shop/CartContext'
import { 
  formatPrice, 
  isOnSale, 
  getDiscountPercentage,
  type ShopifyProduct 
} from '@/lib/shopify/storefront-client'
import { useState } from 'react'

/**
 * Product Card Item - Client Component
 * 
 * Enhanced product card with vinyl record-inspired interactions:
 * - 3D tilt effect on hover
 * - Flip to reveal B-side (artist notes)
 * - Buttery smooth GSAP animations
 * 
 * Falls back to standard ProductCard if vinyl features are disabled
 */

interface ProductCardItemProps {
  product: ShopifyProduct
  /** Enable vinyl-style interactions (default: true) */
  enableVinylEffects?: boolean
}

export function ProductCardItem({ 
  product, 
  enableVinylEffects = true 
}: ProductCardItemProps) {
  const cart = useCart()
  const [isAdding, setIsAdding] = useState(false)
  
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
  
  // Check stock level (if variant inventory available)
  const firstVariant = product.variants.edges[0]?.node
  const inventoryQuantity = (firstVariant as any)?.inventoryQuantity ?? null
  const isLowStock = inventoryQuantity !== null && inventoryQuantity > 0 && inventoryQuantity <= 5

  // Get artist notes from product description or metafields
  const artistNotes = (product as any).metafields?.find(
    (m: any) => m?.key === 'artist_notes' || m?.key === 'artist_statement'
  )?.value || null
  
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
    </>
  )

  // Handle quick add to cart
  const handleQuickAdd = async () => {
    if (isAdding || !product.availableForSale) return
    
    setIsAdding(true)
    
    // Get first available variant
    const variant = product.variants.edges[0]?.node
    if (!variant) {
      setIsAdding(false)
      return
    }

    try {
      // Add to cart
      cart.addItem({
        productId: product.id,
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.title !== 'Default Title' ? variant.title : undefined,
        price: parseFloat(variant.price.amount),
        quantity: 1,
        image: product.featuredImage?.url,
        artistName: product.vendor,
      })
      
      // Brief delay for visual feedback
      setTimeout(() => {
        setIsAdding(false)
      }, 500)
    } catch (error) {
      setIsAdding(false)
    }
  }

  // Use VinylArtworkCard for enhanced interactions
  if (enableVinylEffects) {
    return (
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
        badges={badges}
        available={product.availableForSale}
        showQuickAdd={product.availableForSale}
        onQuickAdd={handleQuickAdd}
        quickAddLoading={isAdding}
        disableFlip={!artistNotes} // Only enable flip if there are artist notes
        disableTilt={false}
        variant="shop"
      />
    )
  }

  // Fallback to standard ProductCard
  return (
    <ProductCard
      title={product.title}
      price={price}
      compareAtPrice={onSale ? compareAtPrice : undefined}
      image={product.featuredImage?.url || ''}
      secondImage={secondImage}
      imageAlt={product.featuredImage?.altText || product.title}
      href={`/shop/${product.handle}`}
      vendor={product.vendor}
      vendorHref={product.vendor ? `/shop?collection=${product.vendor.toLowerCase().replace(/\s+/g, '-')}` : undefined}
      badges={badges}
      transparentBackground={true}
      showQuickAdd={product.availableForSale}
      onQuickAdd={handleQuickAdd}
      quickAddLoading={isAdding}
    />
  )
}
