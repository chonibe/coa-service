import { redirect } from "next/navigation"

/**
 * Legacy demo "authenticate" page.
 *
 * This page used mock data and a hand-rolled pairing flow. The canonical
 * entry point for any NFC-related action is now the collector dashboard
 * (which exposes the real pending-NFC queue) or `/api/nfc-tags/redirect`
 * when coming from a scanned tag.
 *
 * Preserve old deep links (?tagId=, ?error=) so anyone who bookmarked the
 * demo page still lands somewhere useful.
 */
export default function AuthenticatePage({
  searchParams,
}: {
  searchParams?: { tagId?: string; error?: string; token?: string }
}) {
  const params = new URLSearchParams()
  if (searchParams?.tagId) params.set("tagId", searchParams.tagId)
  if (searchParams?.token) params.set("token", searchParams.token)
  if (searchParams?.error) params.set("error", searchParams.error)

  // If we have a tagId or token, route through the canonical entry so the
  // user ends up on `/collector/artwork/[id]` with the right state.
  if (searchParams?.tagId || searchParams?.token) {
    redirect(`/api/nfc-tags/redirect?${params.toString()}`)
  }

  const query = params.toString()
  redirect(`/collector/dashboard${query ? `?${query}` : ""}`)
}
