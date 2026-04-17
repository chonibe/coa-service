/**
 * Single source of truth for support contact details used across the product.
 *
 * Previously we had drift between `support@thestreetlamp.com`,
 * `support@thestreetcollector.com` and `support@streetcollector.com`. Import
 * from here so artists see one identity no matter where they land.
 */

export const SUPPORT_EMAIL = "support@thestreetcollector.com"

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`

export function supportMailto(subject?: string, body?: string): string {
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  const query = params.length ? `?${params.join("&")}` : ""
  return `mailto:${SUPPORT_EMAIL}${query}`
}
