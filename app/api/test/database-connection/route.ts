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

    // Test the connection
    const result = await sql`SELECT NOW() as time`

    return NextResponse.json({
      success: true,
      message: `Connected successfully at ${result[0].time}`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown database connection error",
    })
  }
}
