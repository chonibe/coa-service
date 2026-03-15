/**
 * Meta Parameter Builder Library Implementation
 * 
 * Implements Meta's Parameter Builder Library best practices for:
 * - fbc (Facebook Click ID) generation and management
 * - fbp (Facebook Browser ID) generation and management
 * - IP address extraction (preferring IPv6)
 * - User data normalization
 * 
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-library
 */

const SDK_VERSION = '1.0'
const SDK_LANGUAGE = 'JS'
const INCREMENTALITY = '1'

/**
 * Generate appendix field for Parameter Builder tracking
 * Format: (1) SDK version, (2) Incrementality, (3) SDK language
 */
function generateAppendix(): string {
  return `${SDK_VERSION}${INCREMENTALITY}${SDK_LANGUAGE}`.padEnd(8, '0')
}

/**
 * Get fbc (Facebook Click ID) from cookies or generate from fbclid
 * Format: fb.${subdomain_index}.${creation_time}.${fbclid}.${appendix}
 */
export function getFbc(): string | undefined {
  if (typeof window === 'undefined') return undefined

  // Try to read _fbc cookie first (set by Meta Pixel)
  const fbcCookie = readCookie('_fbc')
  if (fbcCookie) {
    // If it already has appendix, return as-is; otherwise add appendix
    if (fbcCookie.length > 20) return fbcCookie
    return `${fbcCookie}.${generateAppendix()}`
  }

  // Try sc_fbc (our first-party cookie)
  const scFbc = readCookie('sc_fbc')
  if (scFbc) {
    if (scFbc.length > 20) return scFbc
    return `${scFbc}.${generateAppendix()}`
  }

  // Generate from fbclid query parameter if present
  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  if (fbclid) {
    const subdomainIndex = '1'
    const creationTime = Math.floor(Date.now() / 1000)
    return `fb.${subdomainIndex}.${creationTime}.${fbclid}.${generateAppendix()}`
  }

  return undefined
}

/**
 * Get fbp (Facebook Browser ID) from cookies or generate
 * Format: fb.${subdomain_index}.${creation_time}.${random_number}.${appendix}
 */
export function getFbp(): string | undefined {
  if (typeof window === 'undefined') return undefined

  // Try to read _fbp cookie (set by Meta Pixel)
  const fbpCookie = readCookie('_fbp')
  if (fbpCookie) {
    // If it already has appendix, return as-is; otherwise add appendix
    if (fbpCookie.length > 20) return fbpCookie
    return `${fbpCookie}.${generateAppendix()}`
  }

  // Generate new fbp if not present
  const subdomainIndex = '1'
  const creationTime = Math.floor(Date.now() / 1000)
  const randomNumber = Math.floor(Math.random() * 1_000_000_000)
  const fbp = `fb.${subdomainIndex}.${creationTime}.${randomNumber}`
  
  // Store in cookie for future use
  setCookie('_fbp', fbp, 90) // 90 days
  
  return `${fbp}.${generateAppendix()}`
}

/**
 * Get client IP address (preferring IPv6)
 * Client-side: captures IP and stores in cookie for server-side retrieval
 */
export function getClientIpAddress(): string | undefined {
  if (typeof window === 'undefined') return undefined

  // Try to get IP from cookie first (set by client-side capture)
  const ipCookie = readCookie('_meta_client_ip')
  if (ipCookie) return ipCookie

  // Use WebRTC to get local IP (fallback, not always available)
  // Note: This is a simplified approach; full implementation would use
  // a service or WebRTC trickle ICE to get public IP
  return undefined
}

/**
 * Capture and store client IP address in cookie
 * Should be called early in page load
 */
export function captureClientIpAddress(): void {
  if (typeof window === 'undefined') return

  // If already captured, skip
  if (readCookie('_meta_client_ip')) return

  // Use a service to get IP (simplified - in production, use a reliable IP service)
  // For now, we'll rely on server-side IP extraction
  // This is a placeholder for client-side IP capture
}

/**
 * Normalize email address according to Meta's specifications
 */
export function normalizeEmail(email: string): string {
  if (!email) return ''
  return email.trim().toLowerCase()
}

/**
 * Normalize phone number according to Meta's specifications
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  // Remove all non-digit characters except leading +
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Normalize name (first or last)
 */
export function normalizeName(name: string): string {
  if (!name) return ''
  return name.trim()
}

/**
 * Normalize city
 */
export function normalizeCity(city: string): string {
  if (!city) return ''
  return city.trim()
}

/**
 * Normalize state
 */
export function normalizeState(state: string): string {
  if (!state) return ''
  return state.trim()
}

/**
 * Normalize zip code
 */
export function normalizeZip(zip: string): string {
  if (!zip) return ''
  return zip.trim()
}

/**
 * Normalize country code
 */
export function normalizeCountry(country: string): string {
  if (!country) return ''
  return country.trim().toUpperCase()
}

// Helper functions
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const needle = `${encodeURIComponent(name)}=`
  const found = document.cookie.split(';').map((c) => c.trim()).find((c) => c.startsWith(needle))
  if (!found) return null
  return decodeURIComponent(found.slice(needle.length))
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}
