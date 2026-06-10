/**
 * Routes that use the same landing light/dark shell as `/shop/street-collector`
 * (see `app/(store)/layout.tsx` — `LandingThemeProvider`, chat icon, footer dual-tone).
 */

const SHOP_STATIC_SEGMENTS = new Set([
  'account',
  'artist-submissions',
  'artists',
  'blog',
  'careers',
  'cart',
  'checkout',
  'collab',
  'contact',
  'drops',
  'experience',
  'experience-v2',
  'faq',
  'for-business',
  'gift-cards',
  'home',
  'home-v2',
  'membership',
  'pages',
  'reserve',
  'series',
  'street-collector',
  'wholesale',
  'giveaway',
])

export function isCollectorLedStoreShellPath(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname === '/') return true
  if (pathname.startsWith('/shop/street-collector')) return true
  if (pathname.startsWith('/shop/drops')) return true
  if (pathname.startsWith('/shop/artists')) return true
  if (pathname.startsWith('/shop/reserve')) return true

  const m = pathname.match(/^\/shop\/([^/]+)$/)
  if (!m) return false
  const seg = m[1].toLowerCase()
  if (SHOP_STATIC_SEGMENTS.has(seg)) return false
  return true
}
