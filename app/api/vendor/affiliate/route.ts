import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getVendorOrAdminAccess } from '@/lib/vendor-session-with-admin'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://thestreetlamp.com'

/**
 * GET /api/vendor/affiliate
 *
 * Returns the vendor's affiliate link and slug for the dashboard.
 * Requires vendor auth.
 */
export async function GET() {
  const supabase = createClient()

  try {
    const cookieStore = await cookies()
    const access = await getVendorOrAdminAccess(cookieStore)

    if (!access.hasAccess) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (access.isAdmin) {
      return NextResponse.json({ slug: null, affiliateUrl: null, shortUrl: null, message: 'Admin view' })
    }

    const { data: vcList } = await supabase
      .from('vendor_collections')
      .select('shopify_collection_handle')
      .eq('vendor_name', access.vendorName)
      .limit(1)
    const vc = vcList?.[0]

    const slug = vc?.shopify_collection_handle?.trim() || null

    if (!slug) {
      return NextResponse.json({
        slug: null,
        affiliateUrl: null,
        shortUrl: null,
        message: 'No collection handle found. Contact support to get your affiliate link.',
      })
    }

    const affiliateUrl = `${baseUrl}/shop/artists/${encodeURIComponent(slug)}?ref=${encodeURIComponent(slug)}`
    const shortUrl = `${baseUrl}/r/${encodeURIComponent(slug)}`

    return NextResponse.json({
      slug,
      affiliateUrl,
      shortUrl,
    })
  } catch (error) {
    console.error('Error in vendor affiliate API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate link' },
      { status: 500 }
    )
  }
}
