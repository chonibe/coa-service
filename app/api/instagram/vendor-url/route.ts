import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.SUPABASE_CONNECTION_STRING!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get("vendor")

    if (!vendor) {
      return NextResponse.json({ error: "Vendor parameter is required" }, { status: 400 })
    }

    const result = await sql`
      SELECT instagram_url FROM vendor_instagram_urls
      WHERE vendor = ${vendor}
    `

    return NextResponse.json({
      instagram_url: result.length > 0 ? result[0].instagram_url : null,
    })
  } catch (error) {
    console.error("Error fetching vendor Instagram URL:", error)
    return NextResponse.json({ error: "Failed to fetch Instagram URL" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vendor, instagram_url } = await request.json()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor parameter is required" }, { status: 400 })
    }

    // Upsert the Instagram URL
    await sql`
      INSERT INTO vendor_instagram_urls (vendor, instagram_url, updated_at)
      VALUES (${vendor}, ${instagram_url}, NOW())
      ON CONFLICT (vendor)
      DO UPDATE SET
        instagram_url = ${instagram_url},
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving vendor Instagram URL:", error)
    return NextResponse.json({ error: "Failed to save Instagram URL" }, { status: 500 })
  }
}
