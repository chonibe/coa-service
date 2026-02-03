/**
 * Locale Utilities
 * 
 * Helper functions for accessing localized content
 */

import { shopLocale } from '@/content/shop/locales/en'

/**
 * Get localized text for the shop
 * Usage: t('product.addToCart') => 'Add to cart'
 */
export function t(key: string, params?: Record<string, any>): string {
  const keys = key.split('.')
  let value: any = shopLocale
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      console.warn(`Translation key not found: ${key}`)
      return key
    }
  }
  
  // If value is a function, call it with params
  if (typeof value === 'function' && params) {
    return value(...Object.values(params))
  }
  
  return typeof value === 'string' ? value : key
}

/**
 * Pluralize helper
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular
  return plural || `${singular}s`
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
