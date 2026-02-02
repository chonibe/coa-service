import { useCallback, useEffect } from 'react'
import {
  trackViewItem,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackSearch,
  setUserProperties,
  isGAEnabled
} from '@/lib/google-analytics'
import {
  trackShopifyProductView,
  trackShopifyAddToCart,
  trackShopifyRemoveFromCart,
  trackShopifyBeginCheckout,
  trackShopifyAddPaymentInfo,
  trackShopifyPurchase,
  trackShopifySearch,
  setShopifyUserProperties,
  ShopifyProduct,
  ShopifyLineItem
} from '@/lib/shopify-analytics'

// Hook for basic GA tracking
export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, parameters: Record<string, any>) => {
    if (!isGAEnabled()) return

    // Use gtag directly for custom events
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, parameters)
    }
  }, [])

  const setUserProps = useCallback((properties: Record<string, any>) => {
    setUserProperties(properties)
  }, [])

  return {
    trackEvent,
    setUserProps,
    isEnabled: isGAEnabled()
  }
}

// Hook for Shopify e-commerce tracking
export const useShopifyAnalytics = () => {
  // Track product view
  const trackProductView = useCallback((product: ShopifyProduct, variantId?: string) => {
    trackShopifyProductView(product, variantId)
  }, [])

  // Track add to cart
  const trackAddToCart = useCallback((
    product: ShopifyProduct,
    variantId?: string,
    quantity = 1
  ) => {
    trackShopifyAddToCart(product, variantId, quantity)
  }, [])

  // Track remove from cart
  const trackRemoveFromCart = useCallback((
    product: ShopifyProduct,
    variantId?: string,
    quantity = 1
  ) => {
    trackShopifyRemoveFromCart(product, variantId, quantity)
  }, [])

  // Track begin checkout
  const trackBeginCheckout = useCallback((lineItems: ShopifyLineItem[]) => {
    trackShopifyBeginCheckout(lineItems)
  }, [])

  // Track add payment info
  const trackAddPaymentInfo = useCallback((
    paymentType: string,
    lineItems: ShopifyLineItem[]
  ) => {
    trackShopifyAddPaymentInfo(paymentType, lineItems)
  }, [])

  // Track purchase
  const trackPurchase = useCallback((
    orderId: string,
    lineItems: ShopifyLineItem[],
    subtotal: number,
    shipping = 0,
    tax = 0,
    currency = 'USD'
  ) => {
    trackShopifyPurchase(orderId, lineItems, subtotal, shipping, tax, currency)
  }, [])

  // Track search
  const trackSearch = useCallback((searchTerm: string) => {
    trackShopifySearch(searchTerm)
  }, [])

  // Set user properties
  const setUserProps = useCallback((userData: {
    isNewCustomer?: boolean
    country?: string
  }) => {
    setShopifyUserProperties(userData)
  }, [])

  return {
    trackProductView,
    trackAddToCart,
    trackRemoveFromCart,
    trackBeginCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackSearch,
    setUserProps,
    isEnabled: isGAEnabled()
  }
}

// Hook for tracking component interactions
export const useComponentAnalytics = () => {
  const trackClick = useCallback((elementName: string, additionalData?: Record<string, any>) => {
    if (!isGAEnabled()) return

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'click', {
        element_name: elementName,
        ...additionalData
      })
    }
  }, [])

  const trackImpression = useCallback((elementName: string, additionalData?: Record<string, any>) => {
    if (!isGAEnabled()) return

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'impression', {
        element_name: elementName,
        ...additionalData
      })
    }
  }, [])

  return {
    trackClick,
    trackImpression
  }
}

// Hook for tracking user engagement
export const useEngagementTracking = () => {
  useEffect(() => {
    if (!isGAEnabled()) return

    let startTime = Date.now()
    let engagementTime = 0

    const trackEngagement = () => {
      const currentTime = Date.now()
      engagementTime = currentTime - startTime

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'user_engagement', {
          engagement_time_msec: engagementTime
        })
      }
    }

    // Track engagement on page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEngagement()
      } else {
        startTime = Date.now()
      }
    }

    // Track engagement before page unload
    const handleBeforeUnload = () => {
      trackEngagement()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return { isEnabled: isGAEnabled() }
}

// Hook for tracking purchases from server-side webhooks
export const usePurchaseTracking = () => {
  const trackPurchaseFromOrder = useCallback(async (orderId: string) => {
    if (!isGAEnabled()) return

    try {
      // Check if this order needs GA4 tracking
      const response = await fetch(`/api/ga4/purchase-tracking?orderId=${orderId}`)
      const data = await response.json()

      if (data.needsTracking && data.purchaseData) {
        const { trackShopifyPurchase } = await import('@/lib/shopify-analytics')
        const purchaseData = data.purchaseData

        // Send purchase event to GA4
        trackShopifyPurchase(
          purchaseData.orderId,
          purchaseData.lineItems,
          purchaseData.subtotal,
          purchaseData.shipping,
          purchaseData.tax,
          purchaseData.currency
        )

        // Mark as tracked
        await fetch('/api/ga4/purchase-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })

        console.log(`✅ GA4 purchase tracked for order: ${purchaseData.orderName}`)
      }
    } catch (error) {
      console.error('Error tracking purchase:', error)
    }
  }, [])

  return {
    trackPurchaseFromOrder,
    isEnabled: isGAEnabled()
  }
}

// Declare gtag on window for TypeScript
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}