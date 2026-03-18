import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'product-images'
const CACHE_FOLDER = 'spline-cache'
const RESIZE_WIDTH = 800
const CACHE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days client-side

/**
 * GET /api/spline-artwork?productId=<id>&url=<shopify-image-url>
 *
 * Returns a fast-loading URL for a Spline lamp texture:
 * 1. Checks Supabase Storage for a cached 800px WebP.
 * 2. On cache miss: fetches from Shopify, resizes to 800px WebP via sharp, uploads to Supabase.
 * 3. Returns the public Supabase CDN URL so the client skips the proxy round-trip.
 *
 * The Supabase URL is same-region CDN — significantly faster than routing through
 * the Next.js proxy for every artwork selection.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const sourceUrl = searchParams.get('url')

  if (!productId || !sourceUrl) {
    return NextResponse.json({ error: 'productId and url are required' }, { status: 400 })
  }

  // Sanitise productId so it is safe as a filename (strip Shopify GID prefix if present)
  const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120)
  const filePath = `${CACHE_FOLDER}/${safeId}.webp`

  try {
    const supabase = createClient()

    // --- 1. Check cache ---
    const { data: existsData } = await supabase.storage
      .from(BUCKET)
      .list(CACHE_FOLDER, { search: `${safeId}.webp`, limit: 1 })

    if (existsData && existsData.length > 0) {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
      return NextResponse.json(
        { url: urlData.publicUrl, cached: true },
        {
          headers: {
            'Cache-Control': `public, max-age=${CACHE_MAX_AGE}, stale-while-revalidate=86400`,
          },
        }
      )
    }

    // --- 2. Cache miss: fetch original from Shopify ---
    const fetchRes = await fetch(sourceUrl, {
      headers: {
        Accept: 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; COA-SplineArtwork/1.0)',
      },
      signal: AbortSignal.timeout(20000),
      next: { revalidate: 3600 },
    })

    if (!fetchRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch source image: ${fetchRes.status}` },
        { status: 502 }
      )
    }

    const sourceBuffer = Buffer.from(await fetchRes.arrayBuffer())

    // --- 3. Resize to 800px wide WebP via sharp ---
    const webpBuffer = await sharp(sourceBuffer)
      .resize({ width: RESIZE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()

    // --- 4. Upload to Supabase Storage ---
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, webpBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: String(CACHE_MAX_AGE),
      })

    if (uploadError) {
      console.error('[spline-artwork] Supabase upload error:', uploadError.message)
      // Fall back to returning the original source URL so the client still works
      return NextResponse.json(
        { url: sourceUrl, cached: false, fallback: true },
        { status: 200 }
      )
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    return NextResponse.json(
      { url: urlData.publicUrl, cached: false },
      {
        headers: {
          'Cache-Control': `public, max-age=60, stale-while-revalidate=3600`,
        },
      }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[spline-artwork] Error:', message)
    // Always fall back to original URL so Spline preview still works
    return NextResponse.json(
      { url: sourceUrl, cached: false, fallback: true },
      { status: 200 }
    )
  }
}
