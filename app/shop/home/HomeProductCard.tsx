'use client'

import { VinylArtworkCard } from '@/components/vinyl'
import { ProductBadge, Badge } from '@/components/impact'
import { useCart } from '@/lib/shop/CartContext'
import { useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Home Product Card - Client Component
 * 
 * Enhanced product card for homepage with vinyl record-inspired interactions:
 * - 3D tilt effect on hover
 * - Smooth GSAP animations
 * - Quick add to cart functionality
 */

interface HomeProductCardProps {
  product: ShopifyProduct
  compact?: boolean
  disableTilt?: boolean
}

export function HomeProductCard({ product, compact = false, disableTilt = false }: HomeProductCardProps) {
  const cart = useCart()
  const [isAdding, setIsAdding] = useState(false)
  
  // Format price
  const formatPrice = (priceData: any) => {
    const amount = parseFloat(priceData.amount)
    const currencyCode = priceData.currencyCode || 'USD'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  }

  const price = formatPrice(product.priceRange.minVariantPrice)
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
    ? formatPrice(product.compareAtPriceRange.minVariantPrice)
    : undefined
  
  // Check if on sale
  const onSale = compareAtPrice && parseFloat(product.compareAtPriceRange.minVariantPrice.amount) > parseFloat(product.priceRange.minVariantPrice.amount)
  
  // Calculate discount percentage
  const discount = onSale 
    ? Math.round((1 - parseFloat(product.priceRange.minVariantPrice.amount) / parseFloat(product.compareAtPriceRange.minVariantPrice.amount)) * 100)
    : 0
  
  // Get images for hover effect
  const images = product.images?.edges?.map(e => e.node) || []
  const secondImage = images[1]?.url

  // Check if product is new (created in last 30 days)
  const createdAt = (product as any).createdAt
  const createdDate = createdAt ? new Date(createdAt) : null
  const isNew = createdDate ? (Date.now() - createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000 : false
  
  // Get artist notes from metafields
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
    </>
  )

  // Handle quick add to cart
  const handleQuickAdd = async () => {
    if (isAdding || !product.availableForSale) return
    
    setIsAdding(true)
    
    // Get first available variant
    const variant = product.variants?.edges?.[0]?.node
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

  // Get first variant for wishlist
  const firstVariantForWishlist = product.variants?.edges?.[0]?.node
  
  // Debug: Log if variant is missing
  if (!firstVariantForWishlist?.id) {
    console.log('[HomeProductCard] Missing variant ID for product:', product.title, product.id)
  }

  return (
    <VinylArtworkCard
      title={product.title}
      price={price}
      compareAtPrice={onSale ? compareAtPrice : undefined}
      image={product.featuredImage?.url || ''}
      secondImage={secondImage}
      imageAlt={product.featuredImage?.altText || product.title}
      href={`/shop/${product.handle}`}
      artistName={compact ? undefined : product.vendor}
      artistNotes={artistNotes}
      badges={badges}
      available={product.availableForSale}
      showQuickAdd={product.availableForSale}
      onQuickAdd={handleQuickAdd}
      quickAddLoading={isAdding}
      disableFlip={!artistNotes}
      disableTilt={disableTilt}
      variant="shop"
      showWishlist={true}
      productId={product.id}
      variantId={firstVariantForWishlist?.id || product.id}
    />
  )
}
