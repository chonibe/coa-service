import type { ArtistProfileApiResponse, InstagramShowcaseItem } from '@/lib/shop/artist-profile-api'

const GRAPH_VERSION = 'v21.0'

type GraphMediaNode = {
  id?: string
  media_type?: string
  media_url?: string
  permalink?: string
  thumbnail_url?: string
}

type GraphDiscoveryResponse = {
  business_discovery?: {
    username?: string
    media?: { data?: GraphMediaNode[] }
  }
  error?: { message?: string; code?: number }
}

function sanitizeIgUsername(raw: string): string | null {
  const u = raw
    .trim()
    .replace(/^@/, '')
    .split('/')[0]
    ?.split('?')[0]
    ?.replace(/[^a-zA-Z0-9._]/g, '')
  return u || null
}

function mediaToShowcaseItem(m: GraphMediaNode): InstagramShowcaseItem | null {
  const url = (m.media_url || m.thumbnail_url || '').trim()
  if (!url) return null
  const link = (m.permalink || '').trim() || undefined
  const t = (m.media_type || '').toUpperCase()
  let kind: string | undefined
  if (t === 'VIDEO') kind = 'Reel'
  else if (t === 'CAROUSEL_ALBUM') kind = 'Post'
  else if (t === 'IMAGE') kind = 'Post'
  return { url, kind, link }
}

function discoveryIgUserId(): string | undefined {
  return (
    process.env.INSTAGRAM_BUSINESS_DISCOVERY_IG_USER_ID?.trim() ||
    process.env.INSTAGRAM_BUSINESS_ID?.trim() ||
    undefined
  )
}

function discoveryAccessToken(): string | undefined {
  return (
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ||
    process.env.INSTAGRAM_MANUAL_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

/**
 * Fetches recent public media for a **professional** (Business/Creator) Instagram account
 * via [Business Discovery](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-discovery).
 *
 * Env (first match wins per line — aligns with existing Vercel names):
 * - **Caller IG user id:** `INSTAGRAM_BUSINESS_DISCOVERY_IG_USER_ID` or `INSTAGRAM_BUSINESS_ID`
 * - **Token:** `INSTAGRAM_ACCESS_TOKEN` or `INSTAGRAM_MANUAL_ACCESS_TOKEN`
 *
 * Does not work for personal accounts or without Meta app setup. Returns [] if env is missing or the API errors.
 */
export async function fetchInstagramBusinessDiscoveryMedia(targetUsername: string, limit = 12): Promise<InstagramShowcaseItem[]> {
  const igUserId = discoveryIgUserId()
  const token = discoveryAccessToken()
  const user = sanitizeIgUsername(targetUsername)
  if (!igUserId || !token || !user) return []

  const fields = `business_discovery.username(${user}){username,media{id,media_type,media_url,permalink,thumbnail_url}}`
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}`)
  url.searchParams.set('fields', fields)
  url.searchParams.set('access_token', token)

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as GraphDiscoveryResponse
    if (!res.ok || json.error) {
      console.warn('[Instagram Business Discovery]', user, json.error?.message || res.status)
      return []
    }
    const data = json.business_discovery?.media?.data ?? []
    const items: InstagramShowcaseItem[] = []
    for (const m of data) {
      const item = mediaToShowcaseItem(m)
      if (item) items.push(item)
      if (items.length >= limit) break
    }
    return items
  } catch (e) {
    console.warn('[Instagram Business Discovery] fetch failed', user, e)
    return []
  }
}

/** When the collection has no `instagram_showcase` metafield, try Business Discovery using the resolved @handle. */
export async function mergeInstagramDiscoveryIfNeeded(artist: ArtistProfileApiResponse): Promise<ArtistProfileApiResponse> {
  if (artist.profile.instagramShowcase && artist.profile.instagramShowcase.length > 0) {
    return artist
  }
  const handle = artist.instagram?.trim()
  if (!handle) return artist
  const items = await fetchInstagramBusinessDiscoveryMedia(handle)
  if (!items.length) return artist
  return {
    ...artist,
    profile: {
      ...artist.profile,
      instagramShowcase: items,
    },
  }
}
