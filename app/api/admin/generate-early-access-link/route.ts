import { NextRequest, NextResponse } from 'next/server'
import { getUserContext, hasPermission } from '@/lib/rbac'
import { generateEarlyAccessToken } from '@/lib/early-access-token'

/**
 * POST /api/admin/generate-early-access-link
 * 
 * Generates a secure early access link for an artist.
 * Requires admin authentication.
 * 
 * Body: { artistSlug: string }
 * Returns: { link: string, token: string }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getUserContext()
    if (!ctx.userId || !hasPermission(ctx, 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { artistSlug } = body as { artistSlug?: string }

    if (!artistSlug?.trim()) {
      return NextResponse.json(
        { error: 'Artist slug is required' },
        { status: 400 }
      )
    }

    // Generate secure token
    const token = generateEarlyAccessToken(artistSlug.trim())

    // Build the early access link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://app.thestreetcollector.com'
    const link = `${baseUrl}/shop/artists/${artistSlug.trim()}?early_access=1&token=${encodeURIComponent(token)}`

    return NextResponse.json({
      link,
      token,
      artistSlug: artistSlug.trim(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
  } catch (error) {
    console.error('[admin/generate-early-access-link] Error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate link'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
