// Shopify-specific Google Analytics e-commerce tracking utilities

import {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackSearch,
  setUserProperties,
  ProductItem,
  PurchaseData
} from './google-analytics'

import { trackEventWithConversion } from './google-ads-conversions'

// Shopify product data transformation
export interface ShopifyProduct {
  id: string
  title: string
  vendor?: string // Maps to item_brand (artist_name)
  product_type?: string // Maps to item_category2 (product_type)
  tags?: string[]
  variants?: Array<{
    id: string
    title: string
    price: string
    compare_at_price?: string
  }>
  collections?: Array<{
    title: string
  }>
}

export interface ShopifyLineItem {
  id: string
  product_id: string
  title: string
  variant_title?: string
  vendor?: string
  product_type?: string
  quantity: number
  price: string
  line_price: string
}

// Transform Shopify product to GA4 product item
export const transformShopifyProduct = (
  product: ShopifyProduct,
  variantId?: string,
  quantity = 1,
  customPrice?: number
): ProductItem => {
  const variant = variantId
    ? product.variants?.find(v => v.id === variantId)
    : product.variants?.[0]

  const price = customPrice || (variant ? parseFloat(variant.price) : 0)

  // Extract collection name from collections or tags
  const collectionName = product.collections?.[0]?.title ||
    product.tags?.find(tag => tag.includes('Season') || tag.includes('Collection')) ||
    'General'

  return {
    item_id: product.id,
    item_name: product.title,
    item_brand: product.vendor, // artist_name dimension
    item_category: collectionName, // collection_name dimension
    item_category2: product.product_type, // product_type dimension
    price,
    quantity,
    currency: 'USD'
  }
}

// Transform Shopify line item to GA4 product item
export const transformShopifyLineItem = (lineItem: ShopifyLineItem): ProductItem => {
  return {
    item_id: lineItem.product_id,
    item_name: lineItem.title,
    item_brand: lineItem.vendor, // artist_name dimension
    item_category: 'General', // Would need to be enriched from product data
    item_category2: lineItem.product_type, // product_type dimension
    price: parseFloat(lineItem.price),
    quantity: lineItem.quantity,
    currency: 'USD'
  }
}

// Shopify E-commerce Event Trackers

// Track product view on product pages
export const trackShopifyProductView = (product: ShopifyProduct, variantId?: string) => {
  const item = transformShopifyProduct(product, variantId)
  trackViewItem(item)
}

// Track add to cart
export const trackShopifyAddToCart = (
  product: ShopifyProduct,
  variantId?: string,
  quantity = 1
) => {
  const item = transformShopifyProduct(product, variantId, quantity)

  // Track both GA4 and Google Ads conversion
  trackEventWithConversion('add_to_cart', {
    currency: item.currency || 'USD',
    value: item.price ? item.price * (item.quantity || 1) : 0,
    items: [item]
  })
}

// Track remove from cart
export const trackShopifyRemoveFromCart = (
  product: ShopifyProduct,
  variantId?: string,
  quantity = 1
) => {
  const item = transformShopifyProduct(product, variantId, quantity)
  trackRemoveFromCart(item)
}

// Track begin checkout
export const trackShopifyBeginCheckout = (lineItems: ShopifyLineItem[]) => {
  const items = lineItems.map(transformShopifyLineItem)
  const value = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)

  // Track both GA4 and Google Ads conversion
  trackEventWithConversion('begin_checkout', {
    currency: 'USD',
    value,
    items
  })
}

// Track add payment info
export const trackShopifyAddPaymentInfo = (
  paymentType: string,
  lineItems: ShopifyLineItem[]
) => {
  const items = lineItems.map(transformShopifyLineItem)
  const value = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  trackAddPaymentInfo(paymentType, items, value)
}

// Track purchase completion
export const trackShopifyPurchase = (
  orderId: string,
  lineItems: ShopifyLineItem[],
  subtotal: number,
  shipping: number = 0,
  tax: number = 0,
  currency = 'USD'
) => {
  const items = lineItems.map(transformShopifyLineItem)
  const totalValue = subtotal + shipping + tax

  const purchaseData: PurchaseData = {
    transaction_id: orderId,
    value: totalValue,
    currency,
    items,
    shipping // shipping_cost metric
  }

  // Track both GA4 and Google Ads conversion
  trackEventWithConversion('purchase', {
    transaction_id: orderId,
    value: totalValue,
    currency,
    shipping,
    items
  })
}

// Track search
export const trackShopifySearch = (searchTerm: string) => {
  trackSearch(searchTerm)
}

// Set user properties for custom dimensions
export const setShopifyUserProperties = (userData: {
  isNewCustomer?: boolean
  country?: string
}) => {
  setUserProperties({
    customer_status: userData.isNewCustomer ? 'new' : 'returning', // customer_type dimension
    country: userData.country // user_country dimension
  })
}

// Utility to get device category (for device_type dimension)
export const getDeviceCategory = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop'

  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)

  if (isTablet) return 'tablet'
  if (isMobile) return 'mobile'
  return 'desktop'
}

// Enhanced event tracking with Shopify context
export const trackShopifyEvent = (
  eventName: string,
  shopifyData: Record<string, any>,
  additionalParams: Record<string, any> = {}
) => {
  const eventParams = {
    ...shopifyData,
    ...additionalParams,
    // Automatically add device category for device_type dimension
    device_category: getDeviceCategory(),
    // Add source if available (would need to be set from UTM params or referrer)
    source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : undefined
  }

  // Remove undefined values
  Object.keys(eventParams).forEach(key => {
    if (eventParams[key] === undefined) {
      delete eventParams[key]
    }
  })

  // Use the enhanced event tracking
  const { trackEnhancedEvent } = require('./google-analytics')
  trackEnhancedEvent(eventName, eventParams)
}