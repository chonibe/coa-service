import { redirect } from "next/navigation"

import { validateToken } from "@/lib/nfc/token"

/**
 * Legacy "artist unlock" landing page.
 *
 * Deprecated in favour of the canonical collector experience at
 * `/collector/artwork/[lineItemId]`. This file now just decodes the token
 * (if present) and bounces the user through `/api/nfc-tags/redirect`, which
 * handles session / ownership state and routes them correctly.
 */
export default function NfcUnlockPage({
  searchParams,
}: {
  searchParams?: { token?: string }
}) {
  const token = searchParams?.token
  if (!token) {
    redirect("/collector/dashboard?error=missing_token")
  }

  const payload = validateToken(token)
  if (!payload) {
    redirect("/collector/dashboard?error=invalid_token")
  }

  // Forward the signed token to the canonical redirect handler, which will
  // resolve it to a line item and route to `/collector/artwork/[id]`.
  redirect(`/api/nfc-tags/redirect?token=${encodeURIComponent(token)}`)
}
