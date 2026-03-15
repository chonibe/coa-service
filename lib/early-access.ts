/**
 * Early Access Coupon Utilities
 * Manages early access coupons for artists (10% off)
 */

import { cookies } from 'next/headers'

/** Cookie name for storing early access coupon code */
export const EARLY_ACCESS_COUPON_COOKIE = 'early_access_coupon'
export const EARLY_ACCESS_ARTIST_COOKIE = 'early_access_artist'
export const EARLY_ACCESS_COUPON_MAX_AGE_DAYS = 7 // Coupon valid for 7 days

/**
 * Set early access coupon code in cookie
 */
export function setEarlyAccessCouponCookie(couponCode: string, artistSlug: string): void {
  const maxAge = EARLY_ACCESS_COUPON_MAX_AGE_DAYS * 24 * 60 * 60
  const cookieStore = cookies()
  cookieStore.set(EARLY_ACCESS_COUPON_COOKIE, couponCode, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: false, // Need to read from client-side
  })
  cookieStore.set(EARLY_ACCESS_ARTIST_COOKIE, artistSlug, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: false,
  })
}

/**
 * Get early access coupon code from cookie (server-side)
 */
export function getEarlyAccessCouponCookie(): { couponCode: string | null; artistSlug: string | null } {
  const cookieStore = cookies()
  const couponCode = cookieStore.get(EARLY_ACCESS_COUPON_COOKIE)?.value || null
  const artistSlug = cookieStore.get(EARLY_ACCESS_ARTIST_COOKIE)?.value || null
  return { couponCode, artistSlug }
}

/**
 * Clear early access coupon cookies
 */
export function clearEarlyAccessCouponCookie(): void {
  const cookieStore = cookies()
  cookieStore.delete(EARLY_ACCESS_COUPON_COOKIE)
  cookieStore.delete(EARLY_ACCESS_ARTIST_COOKIE)
}

/**
 * Check if a product belongs to an artist (for early access eligibility)
 */
export function isProductFromArtist(productVendor: string, artistSlug: string): boolean {
  // Normalize both for comparison
  const normalizedVendor = productVendor.toLowerCase().replace(/\s+/g, '-')
  const normalizedSlug = artistSlug.toLowerCase().replace(/\s+/g, '-')
  
  // Check exact match or if vendor contains slug
  return normalizedVendor === normalizedSlug || 
         normalizedVendor.includes(normalizedSlug) ||
         normalizedSlug.includes(normalizedVendor)
}
