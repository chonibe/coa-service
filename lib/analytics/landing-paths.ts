/** Marketing / high-LCP routes where third-party scripts are deferred for performance. */
export const LANDING_PATHS = [
  '/',
  '/shop/street-collector',
  '/shop/experience',
  '/experience',
] as const

export function isLandingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return LANDING_PATHS.some(
    (p) => pathname === p || pathname === `${p}/` || pathname.startsWith(`${p}/`)
  )
}

/** PostHog / GA defer window on landing paths (ms). */
export const LANDING_ANALYTICS_DEFER_MS = 10_000
