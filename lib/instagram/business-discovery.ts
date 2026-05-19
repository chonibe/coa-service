import https from 'node:https'
import zlib from 'node:zlib'
import type {
  ArtistProfileApiResponse,
  InstagramProfileSummary,
  InstagramShowcaseItem,
} from '@/lib/shop/artist-profile-api'

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
    name?: string
    biography?: string
    profile_picture_url?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
    website?: string
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

function sanitizeOptionalText(raw: string | undefined): string | undefined {
  const text = raw?.trim()
  return text ? text : undefined
}

function profileFromDiscovery(
  user: string,
  data: NonNullable<GraphDiscoveryResponse['business_discovery']>
): InstagramProfileSummary {
  return {
    handle: sanitizeOptionalText(data.username) || user,
    url: `https://www.instagram.com/${sanitizeOptionalText(data.username) || user}/`,
    displayName: sanitizeOptionalText(data.name),
    biography: sanitizeOptionalText(data.biography),
    avatarUrl: sanitizeOptionalText(data.profile_picture_url),
    followersCount: Number.isFinite(data.followers_count) ? data.followers_count : undefined,
    followsCount: Number.isFinite(data.follows_count) ? data.follows_count : undefined,
    mediaCount: Number.isFinite(data.media_count) ? data.media_count : undefined,
    website: sanitizeOptionalText(data.website),
  }
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
    process.env.INSTAGRAM_MANUAL_ACCESS_TOKEN?.trim() ||
    process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ||
    undefined
  )
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#0*64;/g, '@')
    .replace(/&#x2022;/gi, '•')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function parseMetaTag(html: string, key: string): string | undefined {
  const normalizedKey = key.toLowerCase()
  const patterns =
    normalizedKey === 'og:description'
      ? [
          /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i,
          /<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i,
        ]
      : normalizedKey === 'og:image'
        ? [
            /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
            /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
          ]
        : normalizedKey === 'og:title'
          ? [
              /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i,
              /<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i,
            ]
          : []
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1].trim())
  }
  return undefined
}

function parseCount(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const n = Number.parseInt(raw.replace(/[^\d]/g, ''), 10)
  return Number.isFinite(n) ? n : undefined
}

function parsePublicDescription(description: string | undefined): Pick<
  InstagramProfileSummary,
  'displayName' | 'followersCount' | 'followsCount' | 'mediaCount'
> {
  if (!description) return {}
  const match = description.match(
    /([\d,]+)\s+Followers,\s+([\d,]+)\s+Following,\s+([\d,]+)\s+Posts\s+-\s+See Instagram photos and videos from\s+(.+?)\s+\(@/i
  )
  if (!match) return {}
  return {
    followersCount: parseCount(match[1]),
    followsCount: parseCount(match[2]),
    mediaCount: parseCount(match[3]),
    displayName: match[4]?.trim() || undefined,
  }
}

function fetchTextViaHttps(url: string): Promise<{ statusCode?: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
        res.on('end', () => {
          const compressed = Buffer.concat(chunks)
          const encoding = String(res.headers['content-encoding'] || '').toLowerCase()
          let bodyBuffer = compressed
          try {
            if (encoding.includes('br')) bodyBuffer = zlib.brotliDecompressSync(compressed)
            else if (encoding.includes('gzip')) bodyBuffer = zlib.gunzipSync(compressed)
            else if (encoding.includes('deflate')) bodyBuffer = zlib.inflateSync(compressed)
          } catch {
            bodyBuffer = compressed
          }
          resolve({
            statusCode: res.statusCode,
            body: bodyBuffer.toString('utf8'),
          })
        })
      }
    )
    req.on('error', reject)
    req.end()
  })
}

export async function fetchInstagramPublicProfileSummary(
  targetUsername: string
): Promise<InstagramProfileSummary | undefined> {
  const user = sanitizeIgUsername(targetUsername)
  if (!user) return undefined
  try {
    const res = await fetchTextViaHttps(`https://www.instagram.com/${user}/`)
    if (!res.statusCode || res.statusCode >= 400) return undefined
    const html = res.body
    const description = parseMetaTag(html, 'og:description')
    const parsed = parsePublicDescription(description)
    const avatarUrl = parseMetaTag(html, 'og:image')
    const title = parseMetaTag(html, 'og:title')
    const titleName = title?.match(/^(.+?)\s+\(@/i)?.[1]?.trim()
    return {
      handle: user,
      url: `https://www.instagram.com/${user}/`,
      displayName: parsed.displayName || titleName || undefined,
      avatarUrl,
      followersCount: parsed.followersCount,
      followsCount: parsed.followsCount,
      mediaCount: parsed.mediaCount,
    }
  } catch {
    return undefined
  }
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
  const result = await fetchInstagramBusinessDiscovery(targetUsername, limit)
  return result.items
}

export async function fetchInstagramBusinessDiscovery(
  targetUsername: string,
  limit = 12
): Promise<{ items: InstagramShowcaseItem[]; profile?: InstagramProfileSummary }> {
  const igUserId = discoveryIgUserId()
  const token = discoveryAccessToken()
  const user = sanitizeIgUsername(targetUsername)
  if (!igUserId || !token || !user) return { items: [] }

  const fields = `business_discovery.username(${user}){username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website,media{id,media_type,media_url,permalink,thumbnail_url}}`
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
      return { items: [] }
    }
    const discovery = json.business_discovery
    if (!discovery) return { items: [] }
    const data = discovery.media?.data ?? []
    const items: InstagramShowcaseItem[] = []
    for (const m of data) {
      const item = mediaToShowcaseItem(m)
      if (item) items.push(item)
      if (items.length >= limit) break
    }
    return {
      items,
      profile: profileFromDiscovery(user, discovery),
    }
  } catch (e) {
    console.warn('[Instagram Business Discovery] fetch failed', user, e)
    return { items: [] }
  }
}

/** When the collection has no `instagram_showcase` metafield, try Business Discovery using the resolved @handle. */
export async function mergeInstagramDiscoveryIfNeeded(artist: ArtistProfileApiResponse): Promise<ArtistProfileApiResponse> {
  if (
    artist.profile.instagramProfile &&
    artist.profile.instagramShowcase &&
    artist.profile.instagramShowcase.length > 0
  ) {
    return artist
  }
  const handle = artist.instagram?.trim()
  if (!handle) return artist
  const { items, profile } = await fetchInstagramBusinessDiscovery(handle)
  const fallbackProfile = await fetchInstagramPublicProfileSummary(handle)
  const mergedProfile = {
    ...(fallbackProfile || {}),
    ...(profile || {}),
  }
  const hasProfileData = Boolean(
    mergedProfile.handle ||
      mergedProfile.displayName ||
      mergedProfile.avatarUrl ||
      mergedProfile.followersCount ||
      mergedProfile.followsCount ||
      mergedProfile.mediaCount
  )
  if (!items.length && !hasProfileData) return artist
  return {
    ...artist,
    profile: {
      ...artist.profile,
      instagramShowcase:
        artist.profile.instagramShowcase && artist.profile.instagramShowcase.length > 0
          ? artist.profile.instagramShowcase
          : items,
      instagramProfile: artist.profile.instagramProfile
        ? {
            ...mergedProfile,
            ...artist.profile.instagramProfile,
          }
        : mergedProfile,
    },
  }
}
