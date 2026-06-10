/**
 * Destination for team notifications when someone submits the public artist forms
 * (`/for-artists/apply`, `/shop/artist-submissions`).
 *
 * Set `ARTIST_APPLICATION_NOTIFY_EMAIL` to override (comma-separated for multiple inboxes).
 * If unset, notifications go to choni@thestreetcollector.com (product default for this channel).
 */
export function getArtistApplicationNotifyRecipients(): string | string[] {
  const explicit = process.env.ARTIST_APPLICATION_NOTIFY_EMAIL?.trim()
  if (!explicit) {
    return "choni@thestreetcollector.com"
  }

  const parts = explicit
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return "choni@thestreetcollector.com"
  return parts.length === 1 ? parts[0]! : parts
}
