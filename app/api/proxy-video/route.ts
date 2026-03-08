import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = ['https://thestreetcollector.com', 'https://www.thestreetcollector.com', 'https://cdn.shopify.com']

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.some(
      (origin) =>
        parsed.origin === origin ||
        parsed.hostname.endsWith('.thestreetcollector.com') ||
        parsed.hostname.endsWith('.cdn.shopify.com')
    )
  } catch {
    return false
  }
}

/**
 * If URL is thestreetcollector.com/cdn/shop/videos/c/vp/{id}/..., return cdn.shopify.com short URL for same video.
 * Many store video URLs 404 when fetched server-side; cdn.shopify.com often serves the same asset.
 */
function cdnFallbackUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'thestreetcollector.com' && !parsed.hostname.endsWith('.thestreetcollector.com'))
      return null
    // Match /cdn/shop/videos/c/vp/{id}/... or .../vp/{id}/...
    const match = parsed.pathname.match(/\/videos\/c\/vp\/([a-f0-9]{32})\//i)
    if (!match) return null
    const id = match[1]
    return `https://cdn.shopify.com/videos/c/o/v/${id}.mp4`
  } catch {
    return null
  }
}

function buildFetchHeaders(
  targetUrl: string,
  range: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'video/*',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
  }
  if (range) headers['Range'] = range
  try {
    const parsed = new URL(targetUrl)
    if (parsed.origin === 'https://thestreetcollector.com') {
      headers['Origin'] = 'https://thestreetcollector.com'
      headers['Referer'] = 'https://thestreetcollector.com/'
    }
  } catch {
    // ignore
  }
  return headers
}

async function fetchVideo(
  url: string,
  range: string | null
): Promise<{ res: Response; usedUrl: string }> {
  const headers = buildFetchHeaders(url, range)
  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(30000),
  })
  return { res, usedUrl: url }
}

/**
 * GET /api/proxy-video?url=<encoded-video-url>
 * Proxies video from allowed CDNs to avoid CORS blocking playback.
 * Supports Range requests for seeking.
 * Uses browser-like headers for thestreetcollector.com; on 404, retries with cdn.shopify.com short URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed video URL' }, { status: 400 })
  }

  const range = request.headers.get('range')
  let res: Response
  let usedUrl = url

  try {
    const fallback = cdnFallbackUrl(url)
    const tryFallbackFirst =
      fallback &&
      fallback !== url &&
      (url.startsWith('https://thestreetcollector.com') || new URL(url).hostname === 'thestreetcollector.com')

    let result: { res: Response; usedUrl: string }
    if (tryFallbackFirst) {
      try {
        result = await fetchVideo(fallback, range)
        if (!result.res.ok) result = await fetchVideo(url, range)
      } catch {
        result = await fetchVideo(url, range)
      }
    } else {
      result = await fetchVideo(url, range)
      if (!result.res.ok && result.res.status === 404 && fallback && fallback !== url) {
        const fallbackResult = await fetchVideo(fallback, range)
        if (fallbackResult.res.ok) result = fallbackResult
      }
    }
    res = result.res
    usedUrl = result.usedUrl

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: res.status }
      )
    }

    const contentType = res.headers.get('content-type') || 'video/mp4'
    const contentLength = res.headers.get('content-length')
    const acceptRanges = res.headers.get('accept-ranges') || 'bytes'

    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Accept-Ranges': acceptRanges,
      'Cache-Control': 'public, max-age=86400',
    })
    if (contentLength) responseHeaders.set('Content-Length', contentLength)

    if (res.status === 206) {
      const contentRange = res.headers.get('content-range')
      if (contentRange) responseHeaders.set('Content-Range', contentRange)
    }

    return new NextResponse(res.body, {
      status: res.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    console.error('[proxy-video]', error?.message)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 502 }
    )
  }
}
