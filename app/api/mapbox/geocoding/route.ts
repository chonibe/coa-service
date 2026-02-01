import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

/**
 * Mapbox Geocoding API - Autocomplete Search
 * 
 * Features:
 * - Business search (cafes, studios, galleries)
 * - Landmarks and points of interest
 * - Address completion
 * - City/country search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Get Mapbox token from environment
    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    
    if (!MAPBOX_TOKEN) {
      console.error('[Mapbox Geocoding] NEXT_PUBLIC_MAPBOX_TOKEN not found in environment')
      return NextResponse.json(
        { error: "Mapbox API key not configured" },
        { status: 500 }
      )
    }

    // Mapbox Geocoding API with enhanced parameters
    const url = new URL("https://api.mapbox.com/geocoding/v5/mapbox.places/" + encodeURIComponent(query) + ".json")
    url.searchParams.set("access_token", MAPBOX_TOKEN)
    url.searchParams.set("autocomplete", "true")
    url.searchParams.set("limit", "10")
    url.searchParams.set("types", "poi,address,place,locality,neighborhood") // Include businesses (POI)
    url.searchParams.set("language", "en")

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Mapbox API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform Mapbox results to our format
    const results = data.features.map((feature: any) => ({
      id: feature.id,
      place_id: feature.id,
      name: feature.text,
      display_name: feature.place_name,
      latitude: feature.center[1],
      longitude: feature.center[0],
      place_type: feature.place_type?.[0] || "place",
      address: feature.properties?.address || "",
      category: feature.properties?.category || "",
      maki: feature.properties?.maki || "", // Icon identifier
      context: feature.context || [], // City, region, country hierarchy
    }))

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error("[Mapbox Geocoding API] Error:", error)
    return NextResponse.json(
      { error: "Failed to search locations", message: error.message },
      { status: 500 }
    )
  }
}
