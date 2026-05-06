/**
 * Session preference for `/shop/experience-v3`: show Spline vs product gallery in the hero.
 * Persists across artwork picks in the slideout until the tab is closed.
 */

export type ExperienceV3MainMediaMode = 'spline' | 'gallery'

export const EXPERIENCE_V3_MAIN_MEDIA_KEY = 'sc-experience-v3-main-media-mode'

export function readExperienceV3MainMediaMode(): ExperienceV3MainMediaMode | null {
  if (typeof window === 'undefined') return null
  try {
    const v = sessionStorage.getItem(EXPERIENCE_V3_MAIN_MEDIA_KEY)
    if (v === 'gallery' || v === 'spline') return v
    return null
  } catch {
    return null
  }
}

export function writeExperienceV3MainMediaMode(mode: ExperienceV3MainMediaMode) {
  try {
    sessionStorage.setItem(EXPERIENCE_V3_MAIN_MEDIA_KEY, mode)
  } catch {
    // ignore
  }
}
