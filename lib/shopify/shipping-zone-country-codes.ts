import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'

const SHOPIFY_SHIPPING_ZONES_API_VERSION = '2024-01'

export type ShopifyShippingCountry = { code: string; name: string }

export type FetchShopifyShippingCountriesOutcome = {
  countries: ShopifyShippingCountry[]
  error: 'not_configured' | 'shopify_unreachable' | null
}

/**
 * Canonical “Countries we ship to” (ISO 3166-1 alpha-2 + display names).
 * Stripe `allowed_countries` uses exactly this set so checkout matches policy.
 * @see app/policies/shipping-policy/page.tsx
 * @see content/shop-faq.ts
 */
export const STORE_SHIP_TO_COUNTRIES: ShopifyShippingCountry[] = [
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MT', name: 'Malta' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NO', name: 'Norway' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'KR', name: 'South Korea' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'VN', name: 'Vietnam' },
].sort((a, b) => a.name.localeCompare(b.name))

/** ISO codes only (sorted), for Stripe `allowed_countries`. */
export const STRIPE_CHECKOUT_SHIPPING_COUNTRY_CODES_FALLBACK: string[] = STORE_SHIP_TO_COUNTRIES.map((c) =>
  c.code.toUpperCase()
).sort((a, b) => a.localeCompare(b))

/**
 * Returns the canonical ship-to rows, using Shopify zone labels when the code exists in both.
 */
export function resolveShipToCountriesForDisplay(shopifyCountries: ShopifyShippingCountry[]): ShopifyShippingCountry[] {
  const shopifyByCode = new Map(shopifyCountries.map((c) => [c.code.toUpperCase(), c.name]))
  return STORE_SHIP_TO_COUNTRIES.map(({ code, name }) => ({
    code,
    name: shopifyByCode.get(code.toUpperCase()) ?? name,
  })).sort((a, b) => a.name.localeCompare(b.name))
}

/** Parse Admin REST `shipping_zones.json` body into unique countries (sorted by name). */
export function parseShippingZonesToCountries(data: unknown): ShopifyShippingCountry[] {
  if (!data || typeof data !== 'object' || !('shipping_zones' in data)) {
    return []
  }
  const zones = (data as { shipping_zones?: unknown }).shipping_zones
  if (!Array.isArray(zones)) {
    return []
  }

  const byCode = new Map<string, string>()
  for (const zone of zones) {
    if (!zone || typeof zone !== 'object' || !('countries' in zone)) continue
    const countries = (zone as { countries?: unknown }).countries
    if (!Array.isArray(countries)) continue
    for (const c of countries) {
      if (!c || typeof c !== 'object') continue
      const code = (c as { code?: unknown }).code
      const name = (c as { name?: unknown }).name
      if (typeof code === 'string' && code.trim() && typeof name === 'string' && name.trim()) {
        byCode.set(code.trim().toUpperCase(), name.trim())
      }
    }
  }

  return Array.from(byCode.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([code, name]) => ({ code, name }))
}

/**
 * Loads countries from all Shopify shipping zones (Admin API).
 * Used to enrich labels in `/api/shopify/shipping-countries`; Stripe allow list stays canonical.
 */
export async function fetchShopifyShippingZoneCountries(): Promise<FetchShopifyShippingCountriesOutcome> {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    return { countries: [], error: 'not_configured' }
  }

  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_SHIPPING_ZONES_API_VERSION}/shipping_zones.json`
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[shopify-shipping-zones] Shopify error:', res.status, text)
      return { countries: [], error: 'shopify_unreachable' }
    }

    const data = await res.json()
    const countries = parseShippingZonesToCountries(data)
    return { countries, error: null }
  } catch (err) {
    console.error('[shopify-shipping-zones] Error:', err)
    return { countries: [], error: 'shopify_unreachable' }
  }
}

/**
 * ISO codes for Stripe `shipping_address_collection.allowed_countries` — exactly {@link STORE_SHIP_TO_COUNTRIES}.
 */
export async function getStripeCheckoutAllowedShippingCountryCodes(
  logPrefix = '[stripe-checkout]'
): Promise<string[]> {
  const { countries, error } = await fetchShopifyShippingZoneCountries()
  if (error === 'not_configured') {
    console.warn(`${logPrefix} Shopify not configured; Stripe ship-to uses canonical list (${STORE_SHIP_TO_COUNTRIES.length} countries).`)
  } else if (error === 'shopify_unreachable') {
    console.warn(`${logPrefix} Shopify shipping zones unreachable; Stripe ship-to uses canonical list (${STORE_SHIP_TO_COUNTRIES.length} countries).`)
  } else if (countries.length === 0) {
    console.warn(`${logPrefix} Shopify shipping zones empty; Stripe ship-to uses canonical list (${STORE_SHIP_TO_COUNTRIES.length} countries).`)
  }
  return [...STRIPE_CHECKOUT_SHIPPING_COUNTRY_CODES_FALLBACK]
}
