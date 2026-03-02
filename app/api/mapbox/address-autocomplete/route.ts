import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Address autocomplete for checkout forms.
 * Uses Mapbox Geocoding v5 with address-focused types.
 * Returns structured address components for form fill.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const country = searchParams.get('country') // ISO 3166-1 alpha-2, e.g. US

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!MAPBOX_TOKEN) {
      return NextResponse.json(
        { error: 'Mapbox API key not configured' },
        { status: 500 }
      )
    }

    const url = new URL(
      'https://api.mapbox.com/geocoding/v5/mapbox.places/' +
        encodeURIComponent(query) +
        '.json'
    )
    url.searchParams.set('access_token', MAPBOX_TOKEN)
    url.searchParams.set('autocomplete', 'true')
    url.searchParams.set('limit', '6')
    url.searchParams.set('types', 'address,place')
    url.searchParams.set('language', 'en')
    if (country) {
      url.searchParams.set('country', country)
    }

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()

    const results = (data.features || []).map((feature: {
      id: string
      place_name: string
      text: string
      address?: string
      context?: Array<{ id: string; text: string; country_code?: string }>
      properties?: { address?: string }
    }) => {
      const ctx = feature.context || []
      const countryCtx = ctx.find((c: { id: string }) => c.id.startsWith('country.'))
      const regionCtx = ctx.find((c: { id: string }) => c.id.startsWith('region.'))
      const placeCtx = ctx.find((c: { id: string }) => c.id.startsWith('place.'))
      const postcodeCtx = ctx.find((c: { id: string }) => c.id.startsWith('postcode.'))

      const countryCode = countryCtx
        ? countryCtx.id.replace('country.', '').toUpperCase()
        : ''
      const state = regionCtx?.text || ''

      const addressNumber = feature.properties?.address || feature.address || ''
      const streetName = feature.text || ''
      const addressLine1 =
        addressNumber && streetName
          ? `${addressNumber} ${streetName}`.trim()
          : streetName || addressNumber || feature.place_name.split(',')[0]?.trim() || ''

      return {
        id: feature.id,
        place_name: feature.place_name,
        addressLine1: addressLine1 || feature.place_name,
        city: placeCtx?.text || '',
        state,
        postalCode: postcodeCtx?.text || '',
        country: countryCode || '',
      }
    })

    return NextResponse.json({ results })
  } catch (error: unknown) {
    console.error('[Address Autocomplete] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search addresses',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
