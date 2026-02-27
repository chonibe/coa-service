import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = ['https://thestreetcollector.com', 'https://cdn.shopify.com']

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
 * GET /api/proxy-video?url=<encoded-video-url>
 * Proxies video from allowed CDNs to avoid CORS blocking playback.
 * Supports Range requests for seeking.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed video URL' }, { status: 400 })
  }

  const range = request.headers.get('range')

  const headers: Record<string, string> = {
    Accept: 'video/*',
  }
  if (range) headers['Range'] = range

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(30000),
    })

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
