import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Check if database connection string is available
    if (!process.env.SUPABASE_CONNECTION_STRING) {
      return NextResponse.json({
        success: false,
        error: "SUPABASE_CONNECTION_STRING environment variable is not set",
      })
    }

    // Try to import neon dynamically
    let neon
    try {
      const { neon: importedNeon } = await import("@neondatabase/serverless")
      neon = importedNeon
    } catch (importError) {
      return NextResponse.json({
        success: false,
        error: `Error importing neon: ${importError instanceof Error ? importError.message : "Unknown error"}`,
      })
    }

    // Initialize database connection
    const sql = neon(process.env.SUPABASE_CONNECTION_STRING)

    // First check if the table exists
    try {
      const tableCheck = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'vendor_instagram_urls'
        ) as exists
      `

      if (!tableCheck[0].exists) {
        return NextResponse.json({
          success: false,
          error: "Table 'vendor_instagram_urls' does not exist",
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Error checking table existence: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    }

    // Count records in the table
    const countResult = await sql`SELECT COUNT(*) as count FROM vendor_instagram_urls`

    return NextResponse.json({
      success: true,
      count: countResult[0].count,
      message: `Table exists with ${countResult[0].count} records`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error checking Instagram URL table",
    })
  }
}
