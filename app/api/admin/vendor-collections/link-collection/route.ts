import { NextRequest, NextResponse } from 'next/server'
import { guardAdminRequest } from '@/lib/auth-guards'
import { createClient } from '@/lib/supabase/server'
import { resolveShopifyCollectionFromPastedInput } from '@/lib/shopify/resolve-pasted-collection'
import {
  ensureVendorRowForShopifyArtist,
  resolveVendorForCollectionLink,
} from '@/lib/shop/admin-resolve-vendor-for-collection-link'

/**
 * POST /api/admin/vendor-collections/link-collection
 *
 * Link a Shopify collection (Admin URL, storefront /collections/… URL, or numeric id) to a vendor
 * so experience pages and spotlight use the correct handle, image, and description.
 *
 * Body: { vendorName: string, collectionUrl: string, previewOnly?: boolean, artistSlug?: string, createVendorIfMissing?: boolean }
 */

function textFromHtml(html: string | null): string {
  if (!html?.trim()) return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function POST(request: NextRequest) {
  const auth = guardAdminRequest(request)
  if (auth.kind !== 'ok') {
    return auth.response
  }

  try {
    const body = await request.json()
    const vendorName = (body?.vendorName as string | undefined)?.trim()
    const collectionUrl = (body?.collectionUrl as string | undefined)?.trim()
    const previewOnly = Boolean(body?.previewOnly)
    const artistSlug = (body?.artistSlug as string | undefined)?.trim() || null
    const createVendorIfMissing = body?.createVendorIfMissing !== false

    if (!vendorName) {
      return NextResponse.json({ error: 'vendorName is required' }, { status: 400 })
    }
    if (!collectionUrl) {
      return NextResponse.json({ error: 'collectionUrl is required' }, { status: 400 })
    }

    const col = await resolveShopifyCollectionFromPastedInput(collectionUrl)
    if (!col) {
      return NextResponse.json(
        {
          error:
            'Could not resolve collection. Paste an Admin URL (…/collections/123), a storefront /collections/handle URL, the numeric id, or a valid handle.',
        },
        { status: 400 },
      )
    }

    const preview = {
      shopifyCollectionId: col.id,
      shopifyCollectionHandle: col.handle,
      collectionTitle: col.title,
      imageUrl: col.imageSrc,
      descriptionPreview: textFromHtml(col.bodyHtml).slice(0, 500),
    }

    if (previewOnly) {
      return NextResponse.json({ success: true, preview, saved: false })
    }

    const supabase = createClient()

    let vendor = await resolveVendorForCollectionLink(supabase, {
      vendorName,
      artistSlug,
      collectionHandle: col.handle,
    })

    if (!vendor && createVendorIfMissing) {
      vendor = await ensureVendorRowForShopifyArtist(supabase, vendorName)
    }

    if (!vendor) {
      return NextResponse.json(
        {
          error: `Could not resolve or create a vendor for "${vendorName}". Add them under Vendors first, or set createVendorIfMissing: true (default).`,
        },
        { status: 404 },
      )
    }

    const { data: existing } = await supabase
      .from('vendor_collections')
      .select('id')
      .eq('vendor_id', vendor.id)
      .maybeSingle()

    const row = {
      vendor_id: vendor.id,
      vendor_name: vendor.vendor_name,
      shopify_collection_id: col.id,
      shopify_collection_handle: col.handle,
      collection_title: col.title,
      updated_at: new Date().toISOString(),
    }

    if (existing?.id) {
      const { error: uErr } = await supabase.from('vendor_collections').update(row).eq('id', existing.id)
      if (uErr) {
        console.error('[link-collection] update error:', uErr)
        return NextResponse.json({ error: uErr.message }, { status: 500 })
      }
    } else {
      const { error: iErr } = await supabase.from('vendor_collections').insert(row)
      if (iErr) {
        console.error('[link-collection] insert error:', iErr)
        return NextResponse.json({ error: iErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      preview,
      saved: true,
      experienceArtistParam: col.handle,
    })
  } catch (e) {
    console.error('[link-collection]', e)
    const message = e instanceof Error ? e.message : 'Failed to link collection'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
