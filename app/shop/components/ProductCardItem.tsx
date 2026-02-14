'use client'

import { VinylProductCard } from '@/components/shop/VinylProductCard'
import { useCart } from '@/lib/shop/CartContext'
import { type ShopifyProduct } from '@/lib/shopify/storefront-client'

/**
 * Product Card Item - Client Component
 * 
 * Uses VinylProductCard which includes:
 * - Quick add to cart button (hover)
 * - Wishlist heart button (hover)
 * - Series badges, artist avatar, "in collection" indicator
 * - 3D tilt effect on hover
 * - Flip to reveal B-side (artist notes)
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

  const handleQuickAdd = (prod: ShopifyProduct) => {
    const variant = prod.variants?.edges?.[0]?.node
    if (!variant) return
    
    cart.addItem({
      productId: prod.id,
      variantId: variant.id,
      handle: prod.handle,
      title: prod.title,
      variantTitle: variant.title !== 'Default Title' ? variant.title : undefined,
      price: parseFloat(variant.price.amount),
      quantity: 1,
      image: prod.featuredImage?.url,
      artistName: prod.vendor,
    })
  }

  return (
    <VinylProductCard
      product={product}
      onQuickAdd={handleQuickAdd}
      enableFlip={enableVinylEffects}
      enableTilt={enableVinylEffects}
    />
  )
}
