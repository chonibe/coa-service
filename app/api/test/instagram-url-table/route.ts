import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    // Check for various possible environment variable names
    const possibleConnectionVars = [
      "SUPABASE_CONNECTION_STRING",
      "NEON_DATABASE_URL",
      "POSTGRES_URL",
      "NEON_DATABASE_URL",
      "NEON_POSTGRES_URL",
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]

    // Find the first available connection string
    let connectionString = null
    let connectionVarName = null

    for (const varName of possibleConnectionVars) {
      if (process.env[varName]) {
        connectionString = process.env[varName]
        connectionVarName = varName
        break
      }
    }

    if (!connectionString) {
      console.error("No database connection string found in environment variables")
      return NextResponse.json(
        {
          success: false,
          error: "Database connection string not set",
          checkedVars: possibleConnectionVars,
        },
        { status: 500 },
      )
    }

    // For NEXT_PUBLIC_SUPABASE_URL, we need to format it as a PostgreSQL connection string
    if (connectionVarName === "NEXT_PUBLIC_SUPABASE_URL" || connectionVarName === "SUPABASE_URL") {
      // Check if we have the necessary credentials
      if (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          {
            success: false,
            error: "Found Supabase URL but missing authentication key (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)",
          },
          { status: 500 },
        )
      }

      // We need to convert the Supabase URL to a PostgreSQL connection string
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

      // Extract the project ID from the URL
      const projectId = connectionString.match(/https:\/\/([^.]+)/)?.[1]

      if (!projectId) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid Supabase URL format",
          },
          { status: 500 },
        )
      }

      // Format as PostgreSQL connection string
      connectionString = `postgres://postgres:${supabaseKey}@db.${projectId}.supabase.co:5432/postgres`
    }

    const sql = neon(connectionString)

    // Check if the table exists
    try {
      // Try to create the table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS vendor_instagram_urls (
          id SERIAL PRIMARY KEY,
          vendor TEXT NOT NULL UNIQUE,
          instagram_url TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Count records in the table
      const result = await sql`
        SELECT COUNT(*) as count FROM vendor_instagram_urls
      `

      const count = result[0]?.count || 0

      return NextResponse.json({
        success: true,
        count,
        message: `Table exists with ${count} records`,
      })
    } catch (tableError: any) {
      console.error("Error testing Instagram URL table:", tableError)
      return NextResponse.json(
        {
          success: false,
          error: `Error testing Instagram URL table: ${tableError.message}`,
          cause: tableError.cause?.message || "Unknown cause",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in Instagram URL table test:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error in Instagram URL table test: ${error.message}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
