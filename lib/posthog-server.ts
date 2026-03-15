/**
 * PostHog Server-Side Helper
 *
 * Captures events to PostHog from server-side code (e.g. Meta CAPI, Stripe webhooks).
 * Uses PostHog REST API (batch endpoint) for efficient server-side tracking.
 *
 * Events sent here will appear in PostHog alongside client-side events, allowing
 * you to build funnels that include Meta conversion events and correlate them
 * with session replays.
 */

import crypto from 'crypto'

const POSTHOG_API_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID

// Extract project ID from API key if not set (phc_<project_id>_<random>)
function getProjectId(): string | null {
  if (POSTHOG_PROJECT_ID) return POSTHOG_PROJECT_ID
  if (!POSTHOG_API_KEY) return null
  const match = POSTHOG_API_KEY.match(/^phc_([^_]+)_/)
  return match ? match[1] : null
}

export type PostHogServerEvent = {
  event: string
  distinct_id: string
  properties?: Record<string, string | number | boolean | null | undefined>
  timestamp?: string
  uuid?: string
}

/**
 * Capture a single event to PostHog from server-side code.
 *
 * @param event Event name
 * @param distinctId User distinct ID (email, user ID, or anonymous ID)
 * @param properties Event properties
 */
export async function capturePostHogServerEvent(
  event: string,
  distinctId: string,
  properties?: Record<string, string | number | boolean | null | undefined>
): Promise<{ success: boolean; error?: any }> {
  if (!POSTHOG_API_KEY) {
    return { success: false, error: 'POSTHOG_API_KEY not set' }
  }

  const projectId = getProjectId()
  if (!projectId) {
    return { success: false, error: 'Could not determine PostHog project ID' }
  }

  const payload: PostHogServerEvent = {
    event,
    distinct_id: distinctId,
    properties: {
      ...properties,
      $lib: 'posthog-server',
      $lib_version: '1.0.0',
    },
    timestamp: new Date().toISOString(),
    uuid: crypto.randomUUID(),
  }

  try {
    const response = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/batch/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        batch: [payload],
        api_key: POSTHOG_API_KEY,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return { success: false, error: `PostHog API error: ${response.status} ${text.slice(0, 200)}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error }
  }
}

/**
 * Map Meta CAPI event names to PostHog event names.
 * This ensures Meta conversion events appear in PostHog with consistent naming.
 */
export function mapMetaEventToPostHog(metaEventName: string): string {
  const mapping: Record<string, string> = {
    PageView: '$pageview',
    ViewContent: 'view_item',
    AddToCart: 'add_to_cart',
    InitiateCheckout: 'begin_checkout',
    AddPaymentInfo: 'add_payment_info',
    Purchase: 'purchase',
    Refund: 'refund',
    Search: 'search',
    Lead: 'lead',
  }
  return mapping[metaEventName] || `meta_${metaEventName.toLowerCase()}`
}

/**
 * Extract distinct ID from Meta user data (email, phone, or external_id).
 * Falls back to a hashed identifier if available.
 */
export function extractDistinctIdFromMetaUserData(userData?: {
  em?: string
  ph?: string
  external_id?: string
}): string {
  if (userData?.external_id) return userData.external_id
  if (userData?.em) {
    // Use hashed email as distinct ID (PostHog will match to identified users)
    return `meta_${crypto.createHash('sha256').update(userData.em.trim().toLowerCase()).digest('hex').slice(0, 16)}`
  }
  if (userData?.ph) {
    const normalized = userData.ph.replace(/[^\d+]/g, '')
    return `meta_${crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16)}`
  }
  // Fallback: anonymous ID (Meta will still dedupe via event_id)
  return `meta_anonymous_${crypto.randomUUID().slice(0, 8)}`
}
