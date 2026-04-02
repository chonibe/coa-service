import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/** Allowed origins for image proxy (product images, CDNs). */
const ALLOWED_ORIGINS = [
  'https://thestreetcollector.com',
  'https://cdn.shopify.com',
  'https://shopify.com',
]

const ALLOWED_HOSTNAME_SUFFIXES = [
  '.thestreetcollector.com',
  '.cdn.shopify.com',
  '.shopify.com',
  '.myshopify.com',
  '.supabase.co',
  '.cdninstagram.com',
  '.fbcdn.net',
]

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (ALLOWED_ORIGINS.some((origin) => parsed.origin === origin)) return true
    return ALLOWED_HOSTNAME_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix))
  } catch {
    return false
  }
}

/**
 * GET /api/proxy-image?url=<encoded-image-url>
 * Proxies images from allowed CDNs so the client can use them in canvas/WebGL
 * without CORS (e.g. Spline 3D lamp texture preview).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url || !isAllowedUrl(url)) {
    console.warn('[proxy-image] Invalid or disallowed URL:', url?.slice(0, 80))
    // Return 1x1 transparent GIF so Image doesn't trigger onerror (Spline 3D, canvas)
    const transparentGif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(transparentGif, {
      status: 200,
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=60' },
    })
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'image/*',
      'User-Agent': 'Mozilla/5.0 (compatible; COA-ImageProxy/1.0)',
    }
    try {
      const parsed = new URL(url)
      if (parsed.origin === 'https://thestreetcollector.com') {
        headers['Origin'] = 'https://thestreetcollector.com'
        headers['Referer'] = 'https://thestreetcollector.com/'
      }
    } catch {
      // ignore
    }
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(20000),
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      // Return 1x1 transparent GIF so <img> doesn't break layout (e.g. upstream 404)
      const transparentGif = Buffer.from(
        'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
        'base64'
      )
      return new NextResponse(transparentGif, {
        status: 200,
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=300',
        },
      })
    }

    const contentType = res.headers.get('content-type') || 'image/png'
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    })

    return new NextResponse(res.body, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch image'
    console.error('[proxy-image]', message)
    // Return 1x1 transparent GIF so canvas/WebGL Image doesn't trigger onerror (Spline 3D texture)
    const transparentGif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    )
    return new NextResponse(transparentGif, {
      status: 200,
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'public, max-age=60' },
    })
  }
}
