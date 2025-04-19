import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get("vendor")

    if (!vendor) {
      return NextResponse.json({ error: "Vendor parameter is required" }, { status: 400 })
    }

    // Check if database connection string is available
    if (!process.env.SUPABASE_CONNECTION_STRING) {
      console.error("SUPABASE_CONNECTION_STRING environment variable is not set")
      return NextResponse.json({ instagram_url: null }, { status: 200 })
    }

    // Try to import neon dynamically
    let neon
    try {
      const { neon: importedNeon } = await import("@neondatabase/serverless")
      neon = importedNeon
    } catch (importError) {
      console.error("Error importing neon:", importError)
      return NextResponse.json({ instagram_url: null }, { status: 200 })
    }

    const sql = neon(process.env.SUPABASE_CONNECTION_STRING)

    // Test connection before query
    try {
      await sql`SELECT 1 as test`
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json({ instagram_url: null }, { status: 200 })
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
    return NextResponse.json({ instagram_url: null }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vendor, instagram_url } = await request.json()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor parameter is required" }, { status: 400 })
    }

    // Check if database connection string is available
    if (!process.env.SUPABASE_CONNECTION_STRING) {
      console.error("SUPABASE_CONNECTION_STRING environment variable is not set")
      return NextResponse.json({ error: "Database not configured", success: false }, { status: 200 })
    }

    // Try to import neon dynamically
    let neon
    try {
      const { neon: importedNeon } = await import("@neondatabase/serverless")
      neon = importedNeon
    } catch (importError) {
      console.error("Error importing neon:", importError)
      return NextResponse.json({ error: "Database driver not available", success: false }, { status: 200 })
    }

    const sql = neon(process.env.SUPABASE_CONNECTION_STRING)

    // Test connection before query
    try {
      await sql`SELECT 1 as test`
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json({ error: "Database connection failed", success: false }, { status: 200 })
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
    return NextResponse.json({ error: "Failed to save Instagram URL", success: false }, { status: 200 })
  }
}
