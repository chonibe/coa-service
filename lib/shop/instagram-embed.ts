/**
 * Instagram post/reel permalinks → official embed iframe URLs (public posts).
 * Used when research or metafields store permalinks instead of direct image URLs.
 */
export function getInstagramEmbedSrc(permalink: string): string | null {
  const u = permalink.trim()
  if (!u) return null
  const m = u.match(/instagram\.com\/(p|reel|tv)\/([^/?#]+)/i)
  if (!m) return null
  const kind = m[1].toLowerCase()
  const code = m[2]
  if (kind === 'reel') return `https://www.instagram.com/reel/${code}/embed/`
  return `https://www.instagram.com/p/${code}/embed/`
}

export function isInstagramPostOrReelUrl(url: string): boolean {
  return /instagram\.com\/(p|reel|tv)\//i.test(url.trim())
}
