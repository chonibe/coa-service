// Declare gtag as global function (loaded by GA script)
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// Google Analytics configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

// Helper to check if gtag is available
const isGtagLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

// Initialize gtag dataLayer if not present
const ensureDataLayer = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = []
  }
  if (typeof window !== 'undefined' && !window.gtag) {
    window.gtag = function() {
      window.dataLayer?.push(arguments)
    }
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return

  try {
    // Ensure dataLayer exists
    ensureDataLayer()

    // Wait for gtag script to load
    const checkGtag = () => {
      if (isGtagLoaded() && window.gtag) {
        window.gtag('js', new Date())
        window.gtag('config', GA_MEASUREMENT_ID, {
          page_title: document.title,
          page_location: window.location.href,
        })
      } else {
        // Retry after a short delay
        setTimeout(checkGtag, 100)
      }
    }

    checkGtag()
  } catch (error) {
    console.error('Error initializing GA:', error)
  }
}

// Track page views
export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || !isGtagLoaded()) return

  try {
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || !isGtagLoaded()) return

  try {
    window.gtag?.('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

// Track user interactions
export const trackUserInteraction = (interaction: string, details?: Record<string, any>) => {
  event({
    action: 'user_interaction',
    category: 'engagement',
    label: interaction,
  })
}

// Track page views with custom parameters
export const trackPageView = (pageTitle?: string, pagePath?: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || !isGtagLoaded()) return

  try {
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_title: pageTitle || document.title,
      page_path: pagePath || window.location.pathname,
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

// Check if Google Analytics is enabled
export const isGAEnabled = () => {
  return typeof window !== 'undefined' && !!GA_MEASUREMENT_ID
}

// Get the measurement ID
export const getGAMeasurementId = () => {
  return GA_MEASUREMENT_ID
}

// E-commerce Event Types
export interface ProductItem {
  item_id: string
  item_name: string
  item_brand?: string // artist_name
  item_category?: string // collection_name
  item_category2?: string // product_type
  price?: number
  quantity?: number
  currency?: string
}

export interface PurchaseData {
  transaction_id: string
  value: number
  currency: string
  items: ProductItem[]
  shipping?: number // shipping_cost
  tax?: number
}

// E-commerce Tracking Functions

// Track product view
export const trackViewItem = (item: ProductItem) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'view_item', {
      currency: item.currency || 'USD',
      value: item.price,
      items: [item]
    })
  } catch (error) {
    console.error('Error tracking view_item:', error)
  }
}

// Track add to cart
export const trackAddToCart = (item: ProductItem) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'add_to_cart', {
      currency: item.currency || 'USD',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      items: [item]
    })
  } catch (error) {
    console.error('Error tracking add_to_cart:', error)
  }
}

// Track remove from cart
export const trackRemoveFromCart = (item: ProductItem) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'remove_from_cart', {
      currency: item.currency || 'USD',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      items: [item]
    })
  } catch (error) {
    console.error('Error tracking remove_from_cart:', error)
  }
}

// Track begin checkout
export const trackBeginCheckout = (items: ProductItem[], value?: number, currency = 'USD') => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'begin_checkout', {
      currency,
      value: value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      items
    })
  } catch (error) {
    console.error('Error tracking begin_checkout:', error)
  }
}

// Track add payment info
export const trackAddPaymentInfo = (paymentType: string, items: ProductItem[], value?: number, currency = 'USD') => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'add_payment_info', {
      currency,
      value: value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      payment_type: paymentType,
      items
    })
  } catch (error) {
    console.error('Error tracking add_payment_info:', error)
  }
}

// Track purchase completion
export const trackPurchase = (purchaseData: PurchaseData) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'purchase', {
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.value,
      currency: purchaseData.currency,
      shipping: purchaseData.shipping,
      items: purchaseData.items,
      // Custom metric: items_per_order
      items_count: purchaseData.items.length
    })
  } catch (error) {
    console.error('Error tracking purchase:', error)
  }
}

// Track search
export const trackSearch = (searchTerm: string) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'search', {
      search_term: searchTerm
    })
  } catch (error) {
    console.error('Error tracking search:', error)
  }
}

// Track user engagement
export const trackUserEngagement = (engagementTime: number, sessionId?: string) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'user_engagement', {
      engagement_time_msec: engagementTime,
      session_id: sessionId
    })
  } catch (error) {
    console.error('Error tracking user_engagement:', error)
  }
}

// Set user properties for custom dimensions
export const setUserProperties = (properties: {
  customer_status?: 'new' | 'returning' // customer_type dimension
  country?: string // user_country dimension
}) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('set', 'user_properties', properties)
  } catch (error) {
    console.error('Error setting user properties:', error)
  }
}

// Enhanced event tracking with custom parameters
export const trackEnhancedEvent = (
  eventName: string,
  parameters: Record<string, any>
) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', eventName, parameters)
  } catch (error) {
    console.error('Error tracking enhanced event:', error)
  }
}

// Google Ads Conversion Tracking
export const trackGoogleAdsConversion = (conversionId: string, conversionLabel?: string) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    window.gtag?.('event', 'conversion', {
      send_to: `${GA_MEASUREMENT_ID}/${conversionLabel || conversionId}`,
    })
  } catch (error) {
    console.error('Error tracking Google Ads conversion:', error)
  }
}

// Enhanced conversion tracking for Google Ads
export const trackConversionEvent = (
  eventName: string,
  parameters: Record<string, any>,
  googleAdsConversion?: {
    conversionId: string
    conversionLabel?: string
  }
) => {
  if (!isGAEnabled() || !isGtagLoaded()) return

  try {
    // Track the GA4 event
    window.gtag?.('event', eventName, parameters)

    // If Google Ads conversion is specified, also track it
    if (googleAdsConversion) {
      window.gtag?.('event', 'conversion', {
        send_to: `${GA_MEASUREMENT_ID}/${googleAdsConversion.conversionLabel || googleAdsConversion.conversionId}`,
        ...parameters
      })
    }
  } catch (error) {
    console.error('Error tracking conversion event:', error)
  }
}