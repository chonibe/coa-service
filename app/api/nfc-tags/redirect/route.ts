import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateToken } from "@/lib/nfc/token"
import { verifyCollectorSessionToken } from "@/lib/collector-session"

/**
 * Canonical NFC scan entry point.
 *
 * Every programmed NFC tag (admin-signed or collector-self-programmed) points
 * at this route. We resolve the tag / token to a `line_item_id`, log the
 * scan, and redirect to `/collector/artwork/[lineItemId]` with a query param
 * describing the current state. The artwork page handles the rest (show
 * `NFCAuthSheet`, show read-only preview, etc.).
 *
 * Accepts (any combination):
 *   - `?tagId=...`   — permanent tag ID written to the physical tag
 *   - `?token=...`   — signed short-lived token (admin sign flow)
 *
 * Query params emitted on the destination URL:
 *   - `?authenticated=true`   — signed-in owner, NFC already claimed
 *   - `?claim=pending`        — signed-in owner, not yet claimed (page auto-opens NFCAuthSheet)
 *   - `?preview=true`         — signed-in user, but not the owner (read-only)
 *   - (none, via /login)      — guest; bounced through /login with `redirect` back here
 */

const DASHBOARD_FALLBACK = "/collector/dashboard"

async function logScan(
  supabase: ReturnType<typeof createClient>,
  request: NextRequest,
  tagId: string | null,
) {
  if (!tagId) return
  try {
    await supabase.from("nfc_tag_scans").insert({
      tag_id: tagId,
      scanned_at: new Date().toISOString(),
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })
  } catch (logError) {
    console.error("[nfc-redirect] Error logging scan:", logError)
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const origin = request.nextUrl.origin

  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    let tagId = searchParams.get("tagId")
    let lineItemId: string | null = null
    let orderId: string | null = null

    // ---------------------------------------------------------------------
    // 1. Resolve lineItemId via token (preferred) or tagId lookup.
    // ---------------------------------------------------------------------
    if (token) {
      const payload = validateToken(token)
      if (!payload) {
        return NextResponse.redirect(
          new URL(`${DASHBOARD_FALLBACK}?error=invalid_token`, origin),
        )
      }
      lineItemId = (payload.lineItemId as string) || null
      orderId = (payload.orderId as string) || null
      tagId = (payload.tagId as string) || tagId
    }

    if (!lineItemId && tagId) {
      const { data: tag, error: tagError } = await supabase
        .from("nfc_tags")
        .select("tag_id, status, line_item_id, order_id")
        .eq("tag_id", tagId)
        .maybeSingle()

      if (tagError) {
        console.error("[nfc-redirect] Error checking tag:", tagError)
        return NextResponse.redirect(
          new URL(
            `${DASHBOARD_FALLBACK}?error=database_error&tagId=${encodeURIComponent(tagId)}`,
            origin,
          ),
        )
      }

      if (!tag) {
        await logScan(supabase, request, tagId)
        return NextResponse.redirect(
          new URL(
            `${DASHBOARD_FALLBACK}?error=tag_not_found&tagId=${encodeURIComponent(tagId)}`,
            origin,
          ),
        )
      }

      lineItemId = tag.line_item_id
      orderId = tag.order_id
    }

    // Always log the scan once we know the tagId.
    await logScan(supabase, request, tagId)

    if (!lineItemId) {
      return NextResponse.redirect(
        new URL(`${DASHBOARD_FALLBACK}?error=missing_tag`, origin),
      )
    }

    // ---------------------------------------------------------------------
    // 2. Look up line item + owner (for state decision).
    // ---------------------------------------------------------------------
    const { data: lineItem, error: lineItemError } = await supabase
      .from("order_line_items_v2")
      .select(
        `
          line_item_id,
          order_id,
          nfc_claimed_at,
          orders:order_id ( shopify_customer_id )
        `,
      )
      .eq("line_item_id", lineItemId)
      .maybeSingle()

    if (lineItemError || !lineItem) {
      console.error("[nfc-redirect] Line item not found:", lineItemError)
      return NextResponse.redirect(
        new URL(
          `${DASHBOARD_FALLBACK}?error=line_item_not_found&lineItemId=${encodeURIComponent(
            lineItemId,
          )}`,
          origin,
        ),
      )
    }

    const ownerCustomerId =
      (lineItem.orders as any)?.shopify_customer_id || null

    // ---------------------------------------------------------------------
    // 3. Read collector session (if any) to decide state.
    // ---------------------------------------------------------------------
    const session = verifyCollectorSessionToken(
      request.cookies.get("collector_session")?.value,
    )
    const sessionCustomerId =
      session?.shopifyCustomerId ||
      request.cookies.get("shopify_customer_id")?.value ||
      null

    const artworkPath = `/collector/artwork/${encodeURIComponent(lineItem.line_item_id)}`

    // Guest — bounce through /login so they return to the artwork page signed-in.
    if (!sessionCustomerId) {
      const redirectTarget = `${artworkPath}?scan=pending`
      const loginUrl = new URL("/login", origin)
      loginUrl.searchParams.set("intent", "collector")
      loginUrl.searchParams.set("redirect", redirectTarget)
      return NextResponse.redirect(loginUrl)
    }

    // Signed-in but not the owner — read-only preview.
    if (ownerCustomerId && ownerCustomerId !== sessionCustomerId) {
      return NextResponse.redirect(
        new URL(`${artworkPath}?preview=true`, origin),
      )
    }

    // Signed-in owner, already claimed — normal authenticated view.
    if (lineItem.nfc_claimed_at) {
      return NextResponse.redirect(
        new URL(`${artworkPath}?authenticated=true`, origin),
      )
    }

    // Signed-in owner, not yet claimed — page will auto-open NFCAuthSheet.
    return NextResponse.redirect(
      new URL(`${artworkPath}?claim=pending`, origin),
    )
  } catch (error: any) {
    console.error("[nfc-redirect] Unexpected error:", error)
    return NextResponse.redirect(
      new URL(`${DASHBOARD_FALLBACK}?error=server_error`, origin),
    )
  }
}
