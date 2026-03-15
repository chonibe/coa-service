/**
 * TikTok Events API - Server-Side Implementation
 *
 * Sends server-side events to TikTok Events API for conversion tracking.
 * Supports Purchase and SubmitForm (Lead) events with hashed PII.
 *
 * Reference: https://business.tiktok.com/help/article?aid=9502
 */

import crypto from 'crypto'

const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
const TIKTOK_EVENTS_API_TOKEN = process.env.TIKTOK_EVENTS_API_TOKEN
const TIKTOK_API_VERSION = 'v1.3'

export type TikTokUserData = {
  email?: string
  phone_number?: string
  first_name?: string
  last_name?: string
  city?: string
  state?: string
  zip_code?: string
  country_code?: string
  external_id?: string
  ip?: string
  user_agent?: string
}

export type TikTokEventInput = {
  event: 'Purchase' | 'SubmitForm' | 'CompletePayment' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout'
  event_id?: string
  timestamp?: string // ISO 8601 format
  properties?: {
    value?: number
    currency?: string
    content_type?: string
    content_id?: string
    content_name?: string
    contents?: Array<{
      content_id: string
      content_name?: string
      content_type?: string
      price?: number
      quantity?: number
    }>
  }
  userData?: TikTokUserData
  test_event_code?: string
}

/**
 * Hash value using SHA-256 (for PII fields)
 */
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

/**
 * Normalize phone number (remove non-digits except leading +)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

/**
 * Send event to TikTok Events API
 */
export async function sendTikTokEvent(
  input: TikTokEventInput
): Promise<{ success: boolean; result?: any; error?: any; skipped?: boolean }> {
  if (!TIKTOK_PIXEL_ID || !TIKTOK_EVENTS_API_TOKEN) {
    return {
      success: false,
      skipped: true,
      error: 'Missing NEXT_PUBLIC_TIKTOK_PIXEL_ID or TIKTOK_EVENTS_API_TOKEN',
    }
  }

  const u = input.userData || {}
  
  // Build user data with hashed PII
  const userData: Record<string, any> = {}
  
  if (u.email) {
    userData.email = [sha256(u.email)]
  }
  if (u.phone_number) {
    const normalized = normalizePhone(u.phone_number)
    if (normalized) {
      userData.phone_number = [sha256(normalized)]
    }
  }
  if (u.first_name) {
    userData.first_name = [sha256(u.first_name.trim())]
  }
  if (u.last_name) {
    userData.last_name = [sha256(u.last_name.trim())]
  }
  if (u.city) {
    userData.city = [sha256(u.city.trim())]
  }
  if (u.state) {
    userData.state = [sha256(u.state.trim())]
  }
  if (u.zip_code) {
    userData.zip_code = [sha256(u.zip_code.trim())]
  }
  if (u.country_code) {
    userData.country_code = u.country_code.trim().toUpperCase()
  }
  if (u.external_id) {
    userData.external_id = [sha256(u.external_id.trim().toLowerCase())]
  }
  if (u.ip) {
    userData.ip = u.ip
  }
  if (u.user_agent) {
    userData.user_agent = u.user_agent
  }

  // Build event payload
  const eventPayload: Record<string, any> = {
    event: input.event,
    event_id: input.event_id,
    timestamp: input.timestamp || new Date().toISOString(),
    properties: input.properties || {},
    context: {
      user: userData,
    },
  }

  const body: Record<string, any> = {
    pixel_code: TIKTOK_PIXEL_ID,
    data: [eventPayload],
  }

  if (input.test_event_code) {
    body.test_event_code = input.test_event_code
  }

  try {
    const response = await fetch(
      `https://business-api.tiktok.com/open_api/${TIKTOK_API_VERSION}/event/track/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': TIKTOK_EVENTS_API_TOKEN,
        },
        body: JSON.stringify(body),
      }
    )

    const result = await response.json()
    
    if (!response.ok) {
      return { success: false, error: result }
    }

    return { success: true, result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
