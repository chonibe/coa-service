/**
 * Shared A/B + analytics helpers for the live experience shell (ExperienceV2Client).
 * Keeps cookie name aligned with ExperienceClient and posthog identify merge.
 */

const AB_COOKIE_NAME = "sc_experience_ab"
const AB_COOKIE_MAX_AGE_DAYS = 30

export type ExperienceABVariant = "onboarding" | "skip"

export function getExperienceABVariantFromCookie(): ExperienceABVariant | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${AB_COOKIE_NAME}=([^;]*)`))
  const v = match?.[1]?.trim()
  if (v === "onboarding" || v === "skip") return v
  return null
}

export function setExperienceABVariantCookie(variant: ExperienceABVariant) {
  if (typeof document === "undefined") return
  const maxAge = AB_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${AB_COOKIE_NAME}=${variant}; path=/; max-age=${maxAge}; samesite=lax`
}
