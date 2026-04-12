import { NextResponse } from 'next/server'
import {
  fetchShopifyShippingZoneCountries,
  resolveShipToCountriesForDisplay,
} from '@/lib/shopify/shipping-zone-country-codes'

export interface CountryOption {
  code: string
  name: string
}

/**
 * Fetches countries from Shopify shipping zones and returns the canonical ship-to list
 * (policy-aligned), with labels from Shopify when available.
 */
export async function GET() {
  const { countries, error } = await fetchShopifyShippingZoneCountries()

  if (error === 'not_configured') {
    return NextResponse.json(
      { error: 'Shopify not configured', countries: resolveShipToCountriesForDisplay([]) },
      { status: 503 }
    )
  }

  if (error === 'shopify_unreachable') {
    return NextResponse.json(
      { countries: resolveShipToCountriesForDisplay([]), warning: 'shopify_zones_unavailable' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    )
  }

  const resolved = resolveShipToCountriesForDisplay(countries)

  return NextResponse.json(
    { countries: resolved },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  )
}
