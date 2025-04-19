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

    // Log all environment variables for debugging (without values for security)
    console.log(
      "Available environment variables:",
      Object.keys(process.env)
        .filter(
          (key) =>
            key.includes("SUPABASE") || key.includes("DATABASE") || key.includes("POSTGRES") || key.includes("NEON"),
        )
        .map((key) => `${key}: ${process.env[key] ? "[SET]" : "[NOT SET]"}`),
    )

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

    console.log(`Using connection string from ${connectionVarName}`)

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
      // This is a simplified example - actual implementation may vary
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
      console.log("Converted Supabase URL to PostgreSQL connection string")
    }

    // Try to connect to the database
    try {
      const sql = neon(connectionString)
      const result = await sql`SELECT 1 as test`

      return NextResponse.json({
        success: true,
        message: "Successfully connected to database",
        usedVar: connectionVarName,
      })
    } catch (dbError: any) {
      console.error("Database connection test failed:", dbError)

      return NextResponse.json(
        {
          success: false,
          error: `Error connecting to database: ${dbError.message}`,
          cause: dbError.cause?.message || "Unknown cause",
          usedVar: connectionVarName,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Error testing database connection:", error)

    return NextResponse.json(
      {
        success: false,
        error: `Error testing database connection: ${error.message}`,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
