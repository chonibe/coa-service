import { neon } from "@neondatabase/serverless"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check if database connection string is available
    if (!process.env.SUPABASE_CONNECTION_STRING) {
      console.error("SUPABASE_CONNECTION_STRING environment variable is not set")
      return NextResponse.json(
        {
          error: "Database connection not configured",
          urls: [],
        },
        { status: 500 },
      )
    }

    // Initialize database connection with better error handling
    const sql = neon(process.env.SUPABASE_CONNECTION_STRING)

    // Test the connection
    try {
      await sql`SELECT 1`
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json(
        {
          error: "Database connection failed",
          urls: [],
        },
        { status: 500 },
      )
    }

    // Fetch vendor URLs with timeout
    const result = (await Promise.race([
      sql`
        SELECT vendor, instagram_url, updated_at 
        FROM vendor_instagram_urls
        ORDER BY vendor ASC
      `,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database query timeout")), 5000)),
    ])) as any[]

    return NextResponse.json({
      urls: result || [],
    })
  } catch (error) {
    console.error("Error fetching vendor Instagram URLs:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch Instagram URLs",
        urls: [],
      },
      { status: 500 },
    )
  }
}
