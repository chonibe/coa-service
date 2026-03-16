import { NextRequest, NextResponse } from 'next/server'

/**
 * Forward geocode address to postal code using Nominatim (OpenStreetMap).
 * Proxies the request server-side to avoid CSP connect-src restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const addressLine1 = searchParams.get('address')
  const city = searchParams.get('city')
  const state = searchParams.get('state')
  const country = searchParams.get('country')

  if (!addressLine1 || !city) {
    return NextResponse.json({ error: 'address and city are required' }, { status: 400 })
  }

  try {
    // Build query string for Nominatim
    const queryParts: string[] = []
    if (addressLine1) queryParts.push(addressLine1)
    if (city) queryParts.push(city)
    if (state) queryParts.push(state)
    if (country) queryParts.push(country)
    
    const query = queryParts.join(', ')
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`
    
    const res = await fetch(url, {
      headers: { 
        'Accept-Language': 'en', 
        'User-Agent': 'StreetCollector/1.0',
        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://streetcollector.com'
      },
    })
    
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)
    const data = await res.json()
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ postalCode: null })
    }
    
    const result = data[0]
    const address = result.address || {}
    const postalCode = address.postcode || null
    
    return NextResponse.json({ postalCode })
  } catch (err) {
    console.error('[geo/forward] Error:', err)
    return NextResponse.json(
      { error: 'Geocoding failed', postalCode: null },
      { status: 500 }
    )
  }
}
