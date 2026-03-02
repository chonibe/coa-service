import { NextResponse } from 'next/server'
import { SHOPIFY_SHOP, SHOPIFY_ACCESS_TOKEN } from '@/lib/env'

export interface CountryOption {
  code: string
  name: string
}

/**
 * Fetches countries from Shopify shipping zone settings.
 * Returns unique countries from all shipping zones in the store.
 */
export async function GET() {
  if (!SHOPIFY_SHOP || !SHOPIFY_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'Shopify not configured', countries: [] },
      { status: 503 }
    )
  }

  try {
    const url = `https://${SHOPIFY_SHOP}/admin/api/2024-01/shipping_zones.json`
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[shipping-countries] Shopify error:', res.status, text)
      return NextResponse.json(
        { error: 'Failed to fetch shipping zones', countries: [] },
        { status: 502 }
      )
    }

    const data = await res.json()
    const zones = data.shipping_zones ?? []

    const byCode = new Map<string, string>()
    for (const zone of zones) {
      const countries = zone.countries ?? []
      for (const c of countries) {
        const code = (c.code ?? '').toUpperCase()
        if (code && c.name) {
          byCode.set(code, c.name)
        }
      }
    }

    const countries: CountryOption[] = Array.from(byCode.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([code, name]) => ({ code, name }))

    return NextResponse.json(
      { countries },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    )
  } catch (err) {
    console.error('[shipping-countries] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch shipping countries', countries: [] },
      { status: 500 }
    )
  }
}
