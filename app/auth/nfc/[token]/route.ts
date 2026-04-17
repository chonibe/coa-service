import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Legacy NFC auth entry.
 *
 * Originally this route validated the token, mutated `order_line_items_v2`
 * (setting `nfc_claimed_at`) with a placeholder tag id, then redirected to
 * `/collector/artwork/[id]`. That implicit claim path was hard to reason
 * about and could produce `self-programmed-<timestamp>` junk rows in
 * `nfc_tags`.
 *
 * The canonical flow is now:
 *   1. Tag redirects hit `/api/nfc-tags/redirect?tagId=&token=`.
 *   2. That route decides the state and sends the user to
 *      `/collector/artwork/[id]?claim=pending` when they still need to pair.
 *   3. The artwork page opens `NFCAuthSheet`, which calls
 *      `/api/nfc-tags/claim` with the real tag serial number.
 *
 * Keep this path as a thin 308 so previously-programmed tags keep working.
 */
export function GET(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const origin = request.nextUrl.origin
  const target = new URL("/api/nfc-tags/redirect", origin)
  target.searchParams.set("token", params.token)
  return NextResponse.redirect(target, 308)
}
