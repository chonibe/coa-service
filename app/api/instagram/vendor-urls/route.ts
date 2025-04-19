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
      return NextResponse.json({
        success: false,
        error: "Database connection string not set",
        checkedVars: possibleConnectionVars,
      })
    }

    // For NEXT_PUBLIC_SUPABASE_URL, we need to format it as a PostgreSQL connection string
    if (connectionVarName === "NEXT_PUBLIC_SUPABASE_URL" || connectionVarName === "SUPABASE_URL") {
      // Check if we have the necessary credentials
      if (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
          success: false,
          error: "Found Supabase URL but missing authentication key (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY)",
        })
      }

      // We need to convert the Supabase URL to a PostgreSQL connection string
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

      // Extract the project ID from the URL
      const projectId = connectionString.match(/https:\/\/([^.]+)/)?.[1]

      if (!projectId) {
        return NextResponse.json({
          success: false,
          error: "Invalid Supabase URL format",
        })
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
    } catch (tableError) {
      console.error("Error creating table:", tableError)
      // Continue anyway - table might already exist
    }

    // Fetch all Instagram URLs
    try {
      const urls = await sql`
        SELECT vendor, instagram_url, updated_at
        FROM vendor_instagram_urls
        ORDER BY vendor
      `

      return NextResponse.json({ success: true, urls })
    } catch (queryError: any) {
      console.error("Error fetching Instagram URLs:", queryError)
      return NextResponse.json({
        success: false,
        error: `Error fetching Instagram URLs: ${queryError.message}`,
        cause: queryError.cause?.message || "Unknown cause",
      })
    }
  } catch (error: any) {
    console.error("Error in vendor-urls API:", error)
    return NextResponse.json({
      success: false,
      error: `Error in vendor-urls API: ${error.message}`,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}
