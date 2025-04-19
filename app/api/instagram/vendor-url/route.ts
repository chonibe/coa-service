import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { vendor, instagram_url } = body

    if (!vendor) {
      return NextResponse.json({ success: false, error: "Vendor name is required" }, { status: 400 })
    }

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

    // Check if the table exists and create it if it doesn't
    try {
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

    // Insert or update the Instagram URL
    try {
      await sql`
        INSERT INTO vendor_instagram_urls (vendor, instagram_url, updated_at)
        VALUES (${vendor}, ${instagram_url}, CURRENT_TIMESTAMP)
        ON CONFLICT (vendor) 
        DO UPDATE SET 
          instagram_url = ${instagram_url},
          updated_at = CURRENT_TIMESTAMP
      `

      return NextResponse.json({ success: true })
    } catch (queryError: any) {
      console.error("Error saving Instagram URL:", queryError)
      return NextResponse.json(
        {
          success: false,
          error: `Error saving Instagram URL: ${queryError.message}`,
          cause: queryError.cause?.message || "Unknown cause",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error in vendor-url API:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error in vendor-url API: ${error.message}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
