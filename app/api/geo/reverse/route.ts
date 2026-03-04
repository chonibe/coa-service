import { NextRequest, NextResponse } from 'next/server'

/**
 * Reverse geocode coordinates to address using Nominatim (OpenStreetMap).
 * Proxies the request server-side to avoid CSP connect-src restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 })
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'StreetCollector/1.0' },
    })
    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[geo/reverse] Error:', err)
    return NextResponse.json(
      { error: 'Reverse geocode failed' },
      { status: 500 }
    )
  }
}
