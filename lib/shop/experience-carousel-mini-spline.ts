/** Optional Spline embed URL for ArtworkCarouselBar when `miniSplineLampPreview` is not passed (fallback only). */
export function getMiniSplineEmbedUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_EXPERIENCE_CAROUSEL_MINI_SPLINE_EMBED_URL
  return u && u.trim() ? u.trim() : null
}
