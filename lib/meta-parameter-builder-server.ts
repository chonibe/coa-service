/**
 * Meta Parameter Builder Library - Server-Side Implementation
 * 
 * Implements Meta's Parameter Builder Library best practices for server-side:
 * - IP address extraction (preferring IPv6)
 * - User data normalization
 * - fbc/fbp validation and enhancement
 * 
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-library
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'

const SDK_VERSION = '1.0'
const SDK_LANGUAGE = 'NJS'
const INCREMENTALITY = '1'

/**
 * Generate appendix field for Parameter Builder tracking
 */
function generateAppendix(): string {
  return `${SDK_VERSION}${INCREMENTALITY}${SDK_LANGUAGE}`.padEnd(8, '0')
}

/**
 * Extract client IP address from request (preferring IPv6)
 */
export function getClientIpAddress(request: NextRequest): string | undefined {
  // Priority: IPv6 > IPv4
  // Check various headers for IP address
  
  // 1. Check X-Forwarded-For (most common in Vercel/proxy setups)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    // Prefer IPv6
    const ipv6 = ips.find(ip => ip.includes(':'))
    if (ipv6) return ipv6
    // Fallback to IPv4
    return ips[0]
  }

  // 2. Check X-Real-IP
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    if (realIp.includes(':')) return realIp // IPv6
    return realIp
  }

  // 3. Check CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) {
    if (cfIp.includes(':')) return cfIp // IPv6
    return cfIp
  }

  // 4. Check X-Client-IP
  const clientIp = request.headers.get('x-client-ip')
  if (clientIp) {
    if (clientIp.includes(':')) return clientIp // IPv6
    return clientIp
  }

  return undefined
}

/**
 * Enhance fbc with appendix if not present
 */
export function enhanceFbc(fbc: string | undefined): string | undefined {
  if (!fbc) return undefined
  // If already has appendix (length > 20), return as-is
  if (fbc.length > 20) return fbc
  // Add appendix
  return `${fbc}.${generateAppendix()}`
}

/**
 * Enhance fbp with appendix if not present
 */
export function enhanceFbp(fbp: string | undefined): string | undefined {
  if (!fbp) return undefined
  // If already has appendix (length > 20), return as-is
  if (fbp.length > 20) return fbp
  // Add appendix
  return `${fbp}.${generateAppendix()}`
}

/**
 * Normalize email address according to Meta's specifications
 */
export function normalizeEmail(email: string | undefined): string | undefined {
  if (!email) return undefined
  return email.trim().toLowerCase()
}

/**
 * Normalize phone number according to Meta's specifications
 */
export function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined
  // Remove all non-digit characters except leading +
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Normalize name (first or last)
 */
export function normalizeName(name: string | undefined): string | undefined {
  if (!name) return undefined
  return name.trim()
}

/**
 * Normalize city
 */
export function normalizeCity(city: string | undefined): string | undefined {
  if (!city) return undefined
  return city.trim()
}

/**
 * Normalize state
 */
export function normalizeState(state: string | undefined): string | undefined {
  if (!state) return undefined
  return state.trim()
}

/**
 * Normalize zip code
 */
export function normalizeZip(zip: string | undefined): string | undefined {
  if (!zip) return undefined
  return zip.trim()
}

/**
 * Normalize country code
 */
export function normalizeCountry(country: string | undefined): string | undefined {
  if (!country) return undefined
  return country.trim().toUpperCase()
}

/**
 * Hash value using SHA-256 (for PII fields)
 */
export function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Process user data with Parameter Builder normalization
 */
export function processUserData(userData: {
  em?: string
  ph?: string
  fn?: string
  ln?: string
  ct?: string
  st?: string
  zp?: string
  country?: string
  external_id?: string
  fbp?: string
  fbc?: string
}): {
  em?: string[]
  ph?: string[]
  fn?: string[]
  ln?: string[]
  ct?: string[]
  st?: string[]
  zp?: string[]
  country?: string[]
  external_id?: string[]
  fbp?: string
  fbc?: string
} {
  const processed: any = {}

  if (userData.em) {
    const normalized = normalizeEmail(userData.em)
    if (normalized) processed.em = [hashValue(normalized)]
  }

  if (userData.ph) {
    const normalized = normalizePhone(userData.ph)
    if (normalized) processed.ph = [hashValue(normalized)]
  }

  if (userData.fn) {
    const normalized = normalizeName(userData.fn)
    if (normalized) processed.fn = [hashValue(normalized)]
  }

  if (userData.ln) {
    const normalized = normalizeName(userData.ln)
    if (normalized) processed.ln = [hashValue(normalized)]
  }

  if (userData.ct) {
    const normalized = normalizeCity(userData.ct)
    if (normalized) processed.ct = [hashValue(normalized)]
  }

  if (userData.st) {
    const normalized = normalizeState(userData.st)
    if (normalized) processed.st = [hashValue(normalized)]
  }

  if (userData.zp) {
    const normalized = normalizeZip(userData.zp)
    if (normalized) processed.zp = [hashValue(normalized)]
  }

  if (userData.country) {
    const normalized = normalizeCountry(userData.country)
    if (normalized) processed.country = [hashValue(normalized)]
  }

  if (userData.external_id) {
    const normalized = normalizeEmail(userData.external_id) || userData.external_id.trim().toLowerCase()
    if (normalized) processed.external_id = [hashValue(normalized)]
  }

  // Enhance fbp/fbc with appendix
  if (userData.fbp) {
    processed.fbp = enhanceFbp(userData.fbp)
  }

  if (userData.fbc) {
    processed.fbc = enhanceFbc(userData.fbc)
  }

  return processed
}
