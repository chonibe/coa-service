import crypto from 'crypto'
import { enhanceFbp, enhanceFbc } from './meta-parameter-builder-server'
import {
  capturePostHogServerEvent,
  mapMetaEventToPostHog,
  extractDistinctIdFromMetaUserData,
} from './posthog-server'

export type MetaUserDataInput = {
  em?: string
  ph?: string
  fn?: string
  ln?: string
  ct?: string
  st?: string
  zp?: string
  country?: string
  external_id?: string
  client_ip_address?: string
  client_user_agent?: string
  fbp?: string
  fbc?: string
}

export type MetaEventInput = {
  eventName: string
  eventId?: string
  eventTime?: number
  eventSourceUrl?: string
  actionSource?: 'website' | 'app' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'email' | 'other'
  customData?: Record<string, unknown>
  userData?: MetaUserDataInput
  testEventCode?: string
}

const META_DATASET_API_KEY = process.env.META_DATASET_API_KEY
const META_DATASET_ID =
  process.env.META_DATASET_ID ||
  process.env.META_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  '1315234756106483'
const META_API_VERSION = process.env.META_API_VERSION || 'v22.0'
const DEFAULT_META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '')
}

function withHashedArray(value?: string, normalizer?: (v: string) => string): string[] | undefined {
  if (!value) return undefined
  const normalized = normalizer ? normalizer(value) : value.trim().toLowerCase()
  if (!normalized) return undefined
  return [sha256(normalized)]
}

export async function sendMetaServerEvent(input: MetaEventInput): Promise<{ success: boolean; result?: any; error?: any; skipped?: boolean }> {
  if (!META_DATASET_API_KEY || !META_DATASET_ID) {
    return {
      success: false,
      skipped: true,
      error: 'Missing META_DATASET_API_KEY or META_DATASET_ID/META_PIXEL_ID',
    }
  }

  const u = input.userData || {}
  // Use Parameter Builder Library to enhance fbp/fbc with appendix
  const enhancedFbp = enhanceFbp(u.fbp)
  const enhancedFbc = enhanceFbc(u.fbc)
  
  const eventPayload: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: input.eventTime || Math.floor(Date.now() / 1000),
    action_source: input.actionSource || 'website',
    event_source_url: input.eventSourceUrl,
    event_id: input.eventId,
    user_data: {
      client_ip_address: u.client_ip_address,
      client_user_agent: u.client_user_agent,
      fbp: enhancedFbp,
      fbc: enhancedFbc,
      em: withHashedArray(u.em),
      ph: withHashedArray(u.ph, normalizePhone),
      fn: withHashedArray(u.fn),
      ln: withHashedArray(u.ln),
      ct: withHashedArray(u.ct),
      st: withHashedArray(u.st),
      zp: withHashedArray(u.zp),
      country: withHashedArray(u.country),
      external_id: withHashedArray(u.external_id),
    },
    custom_data: input.customData || {},
  }

  const body: Record<string, unknown> = { data: [eventPayload] }
  const testCode = input.testEventCode || DEFAULT_META_TEST_EVENT_CODE
  if (testCode) body.test_event_code = testCode

  const response = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/${META_DATASET_ID}/events?access_token=${encodeURIComponent(META_DATASET_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )
  const result = await response.json()
  if (!response.ok) {
    return { success: false, error: result }
  }

  // Mirror Meta event to PostHog for unified analytics
  // This allows Meta conversion events to appear in PostHog funnels and be correlated with session replays
  const posthogEventName = mapMetaEventToPostHog(input.eventName)
  const distinctId = extractDistinctIdFromMetaUserData(input.userData)
  const posthogProperties: Record<string, string | number | boolean | null | undefined> = {
    source: 'meta_capi',
    meta_event_name: input.eventName,
    meta_event_id: input.eventId,
    meta_action_source: input.actionSource || 'website',
    ...(input.customData || {}),
  }
  // Add Meta user data fields (non-sensitive) for correlation
  if (input.userData?.country) posthogProperties.meta_country = input.userData.country
  if (input.userData?.fbp) posthogProperties.meta_fbp = input.userData.fbp
  if (input.userData?.fbc) posthogProperties.meta_fbc = input.userData.fbc

  capturePostHogServerEvent(posthogEventName, distinctId, posthogProperties).catch((err) => {
    // Log but don't fail Meta CAPI if PostHog mirror fails
    console.error('[meta-conversions] Failed to mirror event to PostHog:', err)
  })

  return { success: true, result }
}
