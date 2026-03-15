// Declare gtag as global function (loaded by GA script)
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
    fbq?: (...args: any[]) => void
  }
}

// Mirror e-commerce events to PostHog for journey/funnel analysis (no-op if PostHog not inited)
function toPostHog() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional runtime dep
    return require('@/lib/posthog') as {
      captureViewItem?: (i: unknown) => void
      captureAddToCart?: (i: unknown) => void
      captureRemoveFromCart?: (i: unknown) => void
      captureBeginCheckout?: (items: unknown, value?: number, currency?: string) => void
      captureAddPaymentInfo?: (paymentType: string, items: unknown, value?: number, currency?: string) => void
      capturePurchase?: (payload: unknown) => void
      captureSearch?: (searchTerm: string) => void
    }
  } catch {
    return null
  }
}

// Google Analytics configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const META_CAPI_ENDPOINT = '/api/meta/conversions'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const GA_PROXY_ENDPOINT = '/api/analytics/ga-proxy'

type MetaUserData = {
  em?: string
}

type MetaCustomData = {
  currency?: string
  value?: number
  content_ids?: string[]
  content_name?: string
  content_type?: string
  num_items?: number
  search_string?: string
  contents?: Array<{
    id: string
    quantity: number
    item_price: number
  }>
}

import { getFbc, getFbp } from './meta-parameter-builder'

const readCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const needle = `${encodeURIComponent(name)}=`
  const found = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(needle))
  if (!found) return null
  return decodeURIComponent(found.slice(needle.length))
}

const createMetaEventId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `meta_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const getOrCreateGaClientId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined
  const storageKey = 'ga_proxy_cid'
  const existing = window.localStorage.getItem(storageKey)
  if (existing) return existing
  const generated = `${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1_000_000_000)}`
  window.localStorage.setItem(storageKey, generated)
  return generated
}

type GaProxyPayload = {
  eventName: string
  pagePath?: string
  pageLocation?: string
  pageTitle?: string
  value?: number
  currency?: string
}

const sendGaProxyEvent = (payload: GaProxyPayload) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return
  const clientId = getOrCreateGaClientId()
  const requestBody = {
    ...payload,
    clientId,
    pageLocation: payload.pageLocation || window.location.href,
    pageTitle: payload.pageTitle || document.title,
  }

  try {
    fetch(GA_PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {
      // no-op: analytics failure should never break UX
    })
  } catch {
    // no-op: analytics failure should never break UX
  }
}

const dispatchMetaPixel = (eventName: string, customData: MetaCustomData, eventId: string) => {
  if (typeof window === 'undefined' || !META_PIXEL_ID) return
  if (typeof window.fbq !== 'function') return
  try {
    window.fbq('track', eventName, customData, { eventID: eventId })
  } catch {
    // no-op: analytics failure should never break UX
  }
}

const sendMetaConversion = async (
  eventName: string,
  customData: MetaCustomData = {},
  userData: MetaUserData = {},
  eventId?: string
) => {
  if (typeof window === 'undefined') return
  const finalEventId = eventId || createMetaEventId()

  // Send browser Pixel event first, then mirror server-side via CAPI with same event_id.
  dispatchMetaPixel(eventName, customData, finalEventId)

  // Use Parameter Builder Library for fbc/fbp generation
  const fbp = getFbp()
  const fbc = getFbc()

  const payload = {
    eventName,
    eventId: finalEventId,
    eventSourceUrl: window.location.href,
    fbp,
    fbc,
    customData,
    userData,
  }

  try {
    fetch(META_CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // no-op: analytics failure should never break UX
    })
  } catch {
    // no-op: analytics failure should never break UX
  }
}

// Helper to check if gtag is available
const isGtagLoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function'
}

// Queue-safe gtag dispatcher: uses dataLayer stub until gtag.js is ready.
const dispatchGtag = (...args: unknown[]): boolean => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return false
  ensureDataLayer()
  if (!window.gtag) return false
  window.gtag(...args)
  return true
}

// Initialize gtag dataLayer if not present
const ensureDataLayer = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    window.dataLayer = []
  }
  if (typeof window !== 'undefined' && !window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args)
    }
  }
}

/** Set Consent Mode v2 default deny — prevents third-party cookies until user consent (Best Practices).
 * Must run before gtag.js loads. Uses stub gtag from ensureDataLayer. */
export const setConsentDefault = () => {
  if (typeof window === 'undefined') return
  ensureDataLayer()
  if (!window.gtag) return
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
}

/** Grant analytics consent for GA tracking.
 * Use this when no explicit cookie-consent manager is controlling GA. */
export const setConsentGranted = () => {
  if (typeof window === 'undefined') return
  ensureDataLayer()
  if (!window.gtag) return
  window.gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return

  try {
    dispatchGtag('js', new Date())
    dispatchGtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })
  } catch (error) {
    console.error('Error initializing GA:', error)
  }
}

// Track page views
export const pageview = (url: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return

  sendMetaConversion('PageView', {
    content_name: document.title,
    content_type: 'page',
  })

  try {
    dispatchGtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
    sendGaProxyEvent({
      eventName: 'page_view',
      pagePath: url,
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
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return

  try {
    dispatchGtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
    sendGaProxyEvent({
      eventName: action,
      value,
    })
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

// Track user interactions
export const trackUserInteraction = (interaction: string, _details?: Record<string, unknown>) => {
  event({
    action: 'user_interaction',
    category: 'engagement',
    label: interaction,
  })
}

// Track page views with custom parameters
export const trackPageView = (pageTitle?: string, pagePath?: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return

  sendMetaConversion('PageView', {
    content_name: pageTitle || document.title,
    content_type: 'page',
  })

  try {
    dispatchGtag('config', GA_MEASUREMENT_ID, {
      page_title: pageTitle || document.title,
      page_path: pagePath || window.location.pathname,
    })
    sendGaProxyEvent({
      eventName: 'page_view',
      pagePath: pagePath || window.location.pathname,
      pageTitle: pageTitle || document.title,
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

/** Stage/source where the user saw or added the item (for segmentation in PostHog/GA4). */
export type AnalyticsStage =
  | 'home'       // Home page grid
  | 'products'   // Shop products grid
  | 'artist'     // Artist profile page
  | 'pdp'        // Product detail page
  | 'experience' // Experience configurator

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
  /** Where the user saw or added the item (stage/source) for analytics breakdown. */
  item_list_name?: AnalyticsStage
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

// Track product view (PostHog receives regardless of GA; GA when enabled)
export const trackViewItem = (item: ProductItem, userData: MetaUserData = {}) => {
  try {
    toPostHog()?.captureViewItem?.(item)
  } catch {
    // ignore
  }
  sendMetaConversion('ViewContent', {
    currency: item.currency || 'USD',
    value: item.price || 0,
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: 'product',
    num_items: item.quantity || 1,
    contents: [{ id: item.item_id, quantity: item.quantity || 1, item_price: item.price || 0 }],
  }, userData)
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'view_item', {
      currency: item.currency || 'USD',
      value: item.price,
      items: [item]
    })
    sendGaProxyEvent({
      eventName: 'view_item',
      value: item.price,
      currency: item.currency || 'USD',
    })
  } catch (error) {
    console.error('Error tracking view_item:', error)
  }
}

// Track add to cart (PostHog receives regardless of GA; GA when enabled)
export const trackAddToCart = (item: ProductItem, userData: MetaUserData = {}) => {
  try {
    toPostHog()?.captureAddToCart?.(item)
  } catch {
    // ignore
  }
  sendMetaConversion('AddToCart', {
    currency: item.currency || 'USD',
    value: item.price ? item.price * (item.quantity || 1) : 0,
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: 'product',
    num_items: item.quantity || 1,
    contents: [{ id: item.item_id, quantity: item.quantity || 1, item_price: item.price || 0 }],
  }, userData)
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'add_to_cart', {
      currency: item.currency || 'USD',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      items: [item]
    })
    sendGaProxyEvent({
      eventName: 'add_to_cart',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      currency: item.currency || 'USD',
    })
  } catch (error) {
    console.error('Error tracking add_to_cart:', error)
  }
}

// Track remove from cart
export const trackRemoveFromCart = (item: ProductItem) => {
  try {
    toPostHog()?.captureRemoveFromCart?.(item)
  } catch {
    // ignore
  }
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'remove_from_cart', {
      currency: item.currency || 'USD',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      items: [item]
    })
    sendGaProxyEvent({
      eventName: 'remove_from_cart',
      value: item.price ? item.price * (item.quantity || 1) : 0,
      currency: item.currency || 'USD',
    })
  } catch (error) {
    console.error('Error tracking remove_from_cart:', error)
  }
}

// Track begin checkout
export const trackBeginCheckout = (
  items: ProductItem[],
  value?: number,
  currency = 'USD',
  userData: MetaUserData = {}
) => {
  try {
    toPostHog()?.captureBeginCheckout?.(items, value, currency)
  } catch {
    // ignore
  }
  sendMetaConversion(
    'InitiateCheckout',
    {
      currency,
      value: value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      content_ids: items.map((item) => item.item_id),
      content_type: 'product',
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      contents: items.map((item) => ({
        id: item.item_id,
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      })),
    },
    userData
  )
  if (!isGAEnabled()) return

  try {
    const computedValue = value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
    dispatchGtag('event', 'begin_checkout', {
      currency,
      value: computedValue,
      items
    })
    sendGaProxyEvent({
      eventName: 'begin_checkout',
      value: computedValue,
      currency,
    })
  } catch (error) {
    console.error('Error tracking begin_checkout:', error)
  }
}

// Track add payment info
export const trackAddPaymentInfo = (
  paymentType: string,
  items: ProductItem[],
  value?: number,
  currency = 'USD',
  userData: MetaUserData = {}
) => {
  try {
    toPostHog()?.captureAddPaymentInfo?.(paymentType, items, value, currency)
  } catch {
    // ignore
  }
  sendMetaConversion(
    'AddPaymentInfo',
    {
      currency,
      value: value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0),
      content_ids: items.map((item) => item.item_id),
      content_type: 'product',
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      contents: items.map((item) => ({
        id: item.item_id,
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      })),
    },
    userData
  )
  if (!isGAEnabled()) return

  try {
    const computedValue = value || items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
    dispatchGtag('event', 'add_payment_info', {
      currency,
      value: computedValue,
      payment_type: paymentType,
      items
    })
    sendGaProxyEvent({
      eventName: 'add_payment_info',
      value: computedValue,
      currency,
    })
  } catch (error) {
    console.error('Error tracking add_payment_info:', error)
  }
}

// Track purchase completion
export const trackPurchase = (purchaseData: PurchaseData, userData: MetaUserData = {}, eventId?: string) => {
  try {
    toPostHog()?.capturePurchase?.({
      ...purchaseData,
      items_count: purchaseData.items.length,
    })
  } catch {
    // ignore
  }
  // Use webhook-compatible event_id format for deduplication: purchase_${payment_intent || session_id}
  // If eventId is provided, use it; otherwise generate one (for non-webhook flows)
  const purchaseEventId = eventId || (purchaseData.transaction_id ? `purchase_${purchaseData.transaction_id}` : undefined)
  sendMetaConversion(
    'Purchase',
    {
      value: purchaseData.value,
      currency: purchaseData.currency,
      content_ids: purchaseData.items.map((item) => item.item_id),
      content_type: 'product',
      num_items: purchaseData.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      contents: purchaseData.items.map((item) => ({
        id: item.item_id,
        quantity: item.quantity || 1,
        item_price: item.price || 0,
      })),
    },
    userData,
    purchaseEventId
  )
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'purchase', {
      transaction_id: purchaseData.transaction_id,
      value: purchaseData.value,
      currency: purchaseData.currency,
      shipping: purchaseData.shipping,
      items: purchaseData.items,
      // Custom metric: items_per_order
      items_count: purchaseData.items.length
    })
    sendGaProxyEvent({
      eventName: 'purchase',
      value: purchaseData.value,
      currency: purchaseData.currency,
    })
  } catch (error) {
    console.error('Error tracking purchase:', error)
  }
}

// Track search
export const trackSearch = (searchTerm: string) => {
  try {
    toPostHog()?.captureSearch?.(searchTerm)
  } catch {
    // ignore
  }
  sendMetaConversion('Search', {
    search_string: searchTerm,
    content_type: 'product',
  })
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'search', {
      search_term: searchTerm
    })
    sendGaProxyEvent({
      eventName: 'search',
    })
  } catch (error) {
    console.error('Error tracking search:', error)
  }
}

// Track user engagement
export const trackUserEngagement = (engagementTime: number, sessionId?: string) => {
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', 'user_engagement', {
      engagement_time_msec: engagementTime,
      session_id: sessionId
    })
    sendGaProxyEvent({
      eventName: 'user_engagement',
      value: engagementTime,
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
  if (!isGAEnabled()) return

  try {
    dispatchGtag('set', 'user_properties', properties)
  } catch (error) {
    console.error('Error setting user properties:', error)
  }
}

// Enhanced event tracking with custom parameters
export const trackEnhancedEvent = (
  eventName: string,
  parameters: Record<string, any>
) => {
  if (!isGAEnabled()) return

  try {
    dispatchGtag('event', eventName, parameters)
    sendGaProxyEvent({
      eventName,
      value: typeof parameters.value === 'number' ? parameters.value : undefined,
      currency: typeof parameters.currency === 'string' ? parameters.currency : undefined,
    })
  } catch (error) {
    console.error('Error tracking enhanced event:', error)
  }
}

// Google Ads Conversion Tracking with Enhanced Conversions
export const trackGoogleAdsConversion = (
  conversionId: string,
  options?: {
    conversionLabel?: string
    value?: number
    currency?: string
    transaction_id?: string
    email?: string
  }
) => {
  const GOOGLE_ADS_CONVERSION_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID
  if (!isGAEnabled() || !GOOGLE_ADS_CONVERSION_ID) return

  try {
    const sendTo = `${GOOGLE_ADS_CONVERSION_ID}/${options?.conversionLabel || conversionId}`
    const conversionParams: Record<string, any> = {
      send_to: sendTo,
    }

    if (options?.value !== undefined) {
      conversionParams.value = options.value
    }
    if (options?.currency) {
      conversionParams.currency = options.currency
    }
    if (options?.transaction_id) {
      conversionParams.transaction_id = options.transaction_id
    }

    // Enhanced Conversions: hash email if provided (async, but gtag handles it)
    if (options?.email && typeof window !== 'undefined' && typeof crypto !== 'undefined' && crypto.subtle) {
      const normalized = options.email.trim().toLowerCase()
      const encoder = new TextEncoder()
      const data = encoder.encode(normalized)
      
      // Hash asynchronously and then fire conversion event
      crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashedEmail = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
        
        const enhancedParams = {
          ...conversionParams,
          enhanced_conversions: {
            email: hashedEmail,
          },
        }
        
        dispatchGtag('event', 'conversion', enhancedParams)
      }).catch((hashError) => {
        // If hashing fails, send without enhanced conversions
        console.warn('Failed to hash email for Enhanced Conversions:', hashError)
        dispatchGtag('event', 'conversion', conversionParams)
      })
    } else {
      // No email or no crypto support, send standard conversion
      dispatchGtag('event', 'conversion', conversionParams)
    }
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
  if (!isGAEnabled()) return

  try {
    // Track the GA4 event
    dispatchGtag('event', eventName, parameters)

    // If Google Ads conversion is specified, also track it
    if (googleAdsConversion) {
      dispatchGtag('event', 'conversion', {
        send_to: `${GA_MEASUREMENT_ID}/${googleAdsConversion.conversionLabel || googleAdsConversion.conversionId}`,
        ...parameters
      })
    }
  } catch (error) {
    console.error('Error tracking conversion event:', error)
  }
}