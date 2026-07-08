/**
 * E-commerce analytics helpers: build GA4 ProductItem from app data
 * so we can fire view_item, add_to_cart, begin_checkout consistently
 * across shop (storefront) and experience.
 */

import { trackViewItem, trackAddToCart, type ProductItem } from './google-analytics'
import type { CartItem } from './shop/CartContext'

/** Storefront product shape (variants.edges) */
export interface StorefrontProductLike {
  id: string
  title: string
  vendor?: string
  productType?: string
  priceRange?: { minVariantPrice?: { amount?: string } }
  variants?: {
    edges?: Array<{
      node: { id: string; title?: string; price?: { amount: string } }
    }>
  }
}

/**
 * Build a GA4 ProductItem from a storefront product (e.g. from /api/shop/products or Storefront API).
 */
export function storefrontProductToItem(
  product: StorefrontProductLike,
  variant?: { id: string; title?: string; price?: { amount: string } } | null,
  quantity = 1
): ProductItem {
  const price = variant?.price?.amount
    ? parseFloat(variant.price.amount)
    : product.priceRange?.minVariantPrice?.amount
      ? parseFloat(product.priceRange.minVariantPrice.amount)
      : 0
  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.vendor,
    item_category: product.productType || 'General',
    item_category2: product.productType,
    price,
    quantity,
    currency: 'USD',
  }
}

/**
 * Build GA4 ProductItem[] from cart items for begin_checkout.
 */
export function cartItemsToProductItems(items: CartItem[]): ProductItem[] {
  return items.map((i) => ({
    item_id: i.productId,
    item_name: i.title,
    item_brand: i.artistName,
    item_category: undefined,
    item_category2: undefined,
    price: i.price,
    quantity: i.quantity,
    currency: 'USD',
  }))
}

/**
 * Quick-add from a grid/card without visiting PDP or opening a detail sheet.
 * Fires view_item immediately before add_to_cart so funnel steps stay ordered.
 */
export function trackQuickAddToCart(
  product: StorefrontProductLike,
  variant: { id: string; title?: string; price?: { amount: string } } | null | undefined,
  item_list_name: string,
  quantity = 1
) {
  const item = { ...storefrontProductToItem(product, variant, quantity), item_list_name }
  trackViewItem(item)
  trackAddToCart(item)
}
