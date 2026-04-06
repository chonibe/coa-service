/** sessionStorage: user hid the collection-strip mini lamp / Spline preview tile */
const STORAGE_KEY = 'experience-carousel-mini-spline-visible'

export function readMiniSplineCarouselVisible(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const v = sessionStorage.getItem(STORAGE_KEY)
    if (v === null) return true
    return v !== '0'
  } catch {
    return true
  }
}

export function writeMiniSplineCarouselVisible(visible: boolean): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, visible ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}

/** Optional Spline embed URL for ArtworkCarouselBar when `miniSplineLampPreview` is not passed (fallback only). */
export function getMiniSplineEmbedUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_EXPERIENCE_CAROUSEL_MINI_SPLINE_EMBED_URL
  return u && u.trim() ? u.trim() : null
}
