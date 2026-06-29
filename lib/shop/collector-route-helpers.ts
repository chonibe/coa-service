export function buildExperienceUrl(args?: {
  artistSlug?: string | null
  artworkHandle?: string | null
  ref?: string | null
  token?: string | null
  unlisted?: string | null
  earlyAccess?: string | null
}): string {
  const params = new URLSearchParams()
  const artistSlug = args?.artistSlug?.trim()
  const artworkHandle = args?.artworkHandle?.trim()
  const ref = args?.ref?.trim()
  const token = args?.token?.trim()
  const unlisted = args?.unlisted?.trim()
  const earlyAccess = args?.earlyAccess?.trim()

  if (artistSlug) params.set('artist', artistSlug)
  if (artworkHandle) params.set('artwork', artworkHandle)
  if (ref) params.set('ref', ref)
  if (token) params.set('token', token)
  if (unlisted) params.set('unlisted', unlisted)
  if (earlyAccess) params.set('early_access', earlyAccess)

  const query = params.toString()
  return query ? `/shop/experience?${query}` : '/shop/experience'
}

export function buildArtistExploreUrl(slug: string, extras?: { ref?: string | null }): string {
  const trimmed = slug.trim()
  const params = new URLSearchParams()
  if (trimmed) params.set('artist', trimmed)
  const ref = extras?.ref?.trim()
  if (ref) params.set('ref', ref)
  const query = params.toString()
  return query ? `/shop/explore-artists?${query}` : '/shop/explore-artists'
}
