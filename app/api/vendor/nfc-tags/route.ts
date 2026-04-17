import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"
import { vendorApiError } from "@/lib/vendor-api/observability"

// Vendor-facing NFC tag list — Phase 3.9 MVP
//
// Admin already exposes /api/nfc-tags/list, but that endpoint is guarded
// for internal use and returns the whole warehouse. For artists we only
// want the tags attached to *their* sold line items. We scope via the
// existing `order_line_items_v2.vendor_name` join.
//
// Response shape is intentionally thin — the page needs status, artwork
// name, claim state, and timestamps. Richer drill-down lives in the
// warehouse admin surface.

interface VendorNfcTag {
  tagId: string
  status: string
  orderId: string | null
  lineItemId: string | null
  artworkName: string | null
  productId: string | null
  programmedAt: string | null
  claimedAt: string | null
  createdAt: string | null
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)
    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const supabase = createClient()
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name")
      .eq("vendor_name", vendorName)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status") // optional filter
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500)

    // Step 1 — fetch this vendor's line items (id + product + name).
    // We use a generous ceiling because NFC volume per artist is
    // small (in the hundreds, not thousands).
    const { data: lineItems, error: lineItemsError } = await supabase
      .from("order_line_items_v2")
      .select("line_item_id, order_id, name, product_id")
      .eq("vendor_name", vendor.vendor_name)
      .limit(2000)

    if (lineItemsError) {
      return vendorApiError("nfc.line-items", lineItemsError, {
        userMessage: "Failed to load line items",
        context: { vendor: vendorName },
      })
    }

    const lineItemIds = (lineItems || [])
      .map((li: any) => li.line_item_id)
      .filter((id: any) => id !== null && id !== undefined)
      .map((id: any) => String(id))

    if (lineItemIds.length === 0) {
      return NextResponse.json({ tags: [] as VendorNfcTag[] })
    }

    const lineItemByKey = new Map<string, any>()
    for (const li of lineItems || []) {
      lineItemByKey.set(String(li.line_item_id), li)
    }

    // Step 2 — query nfc_tags for those line items.
    let query = supabase
      .from("nfc_tags")
      .select(
        "tag_id, status, line_item_id, order_id, programmed_at, claimed_at, created_at",
      )
      .in("line_item_id", lineItemIds)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data: tags, error: tagsError } = await query

    if (tagsError) {
      return vendorApiError("nfc.tags", tagsError, {
        userMessage: "Failed to load tags",
        context: { vendor: vendorName, statusFilter: status || "all" },
      })
    }

    const response: VendorNfcTag[] = (tags || []).map((t: any) => {
      const li = t.line_item_id ? lineItemByKey.get(String(t.line_item_id)) : null
      return {
        tagId: t.tag_id,
        status: t.status,
        orderId: t.order_id ?? null,
        lineItemId: t.line_item_id ?? null,
        artworkName: li?.name ?? null,
        productId: li?.product_id ? String(li.product_id) : null,
        programmedAt: t.programmed_at,
        claimedAt: t.claimed_at,
        createdAt: t.created_at,
      }
    })

    // Basic aggregate counts for the UI header.
    const counts = response.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1
      return acc
    }, {})

    return NextResponse.json({ tags: response, counts })
  } catch (error: any) {
    return vendorApiError("nfc.handler", error)
  }
}
