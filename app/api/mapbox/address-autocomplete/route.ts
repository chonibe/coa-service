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
    url.searchParams.set('limit', '10')
    url.searchParams.set('types', 'address,place,postcode,locality')
    url.searchParams.set('language', 'en')
    url.searchParams.set('proximity', 'ip')
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
      place_type?: string[]
      text: string
      address?: string
      context?: Array<{ id: string; text?: string; short_code?: string }>
      properties?: { address?: string }
    }) => {
      const ctx = feature.context || []
      const countryCtx = ctx.find((c: { id: string }) => c.id.startsWith('country.'))
      const regionCtx = ctx.find((c: { id: string }) => c.id.startsWith('region.'))
      const placeCtx = ctx.find((c: { id: string }) => c.id.startsWith('place.'))
      const localityCtx = ctx.find((c: { id: string }) => c.id.startsWith('locality.'))
      const postcodeCtx = ctx.find((c: { id: string }) => c.id.startsWith('postcode.'))

      // Use short_code for country (e.g. "us" -> "US"); Mapbox ids are numeric, not codes
      let countryCode = countryCtx?.short_code
        ? String(countryCtx.short_code).toUpperCase()
        : ''

      // Region: prefer short_code "US-IL" -> "IL" for dropdown; fallback to text
      let state = ''
      if (regionCtx?.short_code) {
        const parts = String(regionCtx.short_code).split('-')
        state = parts.length > 1 ? parts[parts.length - 1]! : regionCtx.short_code
      } else if (regionCtx?.text) {
        state = regionCtx.text
      }

      const addressNumber = feature.properties?.address || feature.address || ''
      const streetName = feature.text || ''
      let addressLine1 =
        addressNumber && streetName
          ? `${addressNumber} ${streetName}`.trim()
          : streetName || addressNumber || feature.place_name.split(',')[0]?.trim() || ''
      addressLine1 = addressLine1 || feature.place_name.split(',')[0]?.trim() || feature.place_name

      // For place-type results, the feature itself is the city (feature.text)
      let city = placeCtx?.text || localityCtx?.text || ''
      if (!city && feature.place_type?.includes('place')) city = feature.text || ''
      let postalCode = postcodeCtx?.text || ''

      // Fallback: parse place_name when context is incomplete
      if (!city || !postalCode || !countryCode) {
        const parts = feature.place_name.split(',').map((p) => p.trim())
        if (parts.length >= 2) {
          if (!city) city = parts[1] ?? ''
          if (!postalCode && parts.length >= 3) {
            const stateZip = parts[2] ?? ''
            const zipMatch = stateZip.match(/\b(\d{5}(?:-\d{4})?)\b/)
            if (zipMatch) postalCode = zipMatch[1]!
            else postalCode = stateZip
          }
          if (!countryCode && parts.length >= 4) {
            const last = (parts[parts.length - 1] ?? '').toLowerCase()
            if (last.includes('united states') || last === 'usa') countryCode = 'US'
            else if (last.includes('united kingdom') || last === 'uk') countryCode = 'GB'
            else if (last.includes('canada')) countryCode = 'CA'
            else if (last.includes('australia')) countryCode = 'AU'
          }
        }
      }

      return {
        id: feature.id,
        place_name: feature.place_name,
        addressLine1,
        city,
        state,
        postalCode,
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
