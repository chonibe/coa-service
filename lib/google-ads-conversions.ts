// Google Ads Conversion Configuration
// Maps GA4 events to Google Ads conversion actions for enhanced campaign optimization

export interface GoogleAdsConversion {
  conversionId: string
  conversionLabel: string
  name: string
  category: 'PAGE_VIEW' | 'PURCHASE' | 'SIGN_UP' | 'LEAD' | 'DOWNLOAD' | 'CUSTOM'
  value?: number
  currency?: string
}

// Shopify Event to Google Ads Conversion Mapping
// These conversion IDs and labels should be obtained from Google Ads after creating the conversion actions
export const SHOPIFY_CONVERSIONS: Record<string, GoogleAdsConversion> = {
  // Page View Events
  'page_view': {
    conversionId: 'AW-XXXXXXXXX', // Replace with actual conversion ID
    conversionLabel: 'XXXXXXXXXXXXX', // Replace with actual conversion label
    name: 'Page View',
    category: 'PAGE_VIEW'
  },

  // Product Discovery Events
  'view_item': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Product View',
    category: 'CUSTOM'
  },

  // Cart Events
  'add_to_cart': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Add to Cart',
    category: 'CUSTOM'
  },

  // Checkout Events
  'begin_checkout': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Begin Checkout',
    category: 'CUSTOM'
  },

  'checkout_progress': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Checkout Progress',
    category: 'CUSTOM'
  },

  'add_payment_info': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Add Payment Info',
    category: 'CUSTOM'
  },

  // Purchase Events
  'purchase': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Purchase',
    category: 'PURCHASE',
    currency: 'USD'
  },

  // Search Events
  'search': {
    conversionId: 'AW-XXXXXXXXX',
    conversionLabel: 'XXXXXXXXXXXXX',
    name: 'Search',
    category: 'CUSTOM'
  }
}

// Get conversion config by event name
export const getConversionConfig = (eventName: string): GoogleAdsConversion | null => {
  return SHOPIFY_CONVERSIONS[eventName] || null
}

// Check if an event should trigger a Google Ads conversion
export const shouldTrackConversion = (eventName: string): boolean => {
  return eventName in SHOPIFY_CONVERSIONS
}

// Enhanced tracking function that automatically includes Google Ads conversion
export const trackEventWithConversion = (
  eventName: string,
  parameters: Record<string, any>
) => {
  const { trackConversionEvent } = require('./google-analytics')
  const conversionConfig = getConversionConfig(eventName)

  if (conversionConfig) {
    trackConversionEvent(eventName, parameters, {
      conversionId: conversionConfig.conversionId,
      conversionLabel: conversionConfig.conversionLabel
    })
  } else {
    // Track GA4 event only
    const { trackEnhancedEvent } = require('./google-analytics')
    trackEnhancedEvent(eventName, parameters)
  }
}