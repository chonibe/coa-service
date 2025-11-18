import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { CRON_SECRET } from "@/lib/env"
import { ADMIN_SESSION_COOKIE_NAME, verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET(request: NextRequest) {
  console.log("==== ADMIN CRON RUNNER CALLED ====")
  console.log("Request URL:", request.url)
  console.log("Request headers:", Object.fromEntries(request.headers.entries()))

  try {
    const token = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value
    const adminSession = verifyAdminSessionToken(token)
    if (!adminSession?.email) {
      console.error("Rejected cron run: missing admin session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const secret = searchParams.get("secret")

    // Verify the secret key
    if (CRON_SECRET && secret !== CRON_SECRET) {
      console.error("Invalid secret provided:", secret)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the raw fetch to call the actual cron endpoint
    // Directly construct URL using the origin without middleware interference
    const origin = request.nextUrl.origin
    const cronUrl = `${origin}/api/cron/sync-shopify-orders?secret=${CRON_SECRET}`

    console.log(`Running cron job directly at: ${cronUrl.replace(CRON_SECRET || "", "REDACTED")}`)

    // Make the direct request to the cron endpoint
    const response = await fetch(cronUrl, {
      headers: {
        // Add a special header to bypass middleware if needed
        "x-cron-direct": "true",
      },
      // Extend timeout for longer running operations
      signal: AbortSignal.timeout(120000), // 2 minute timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cron job failed: ${response.status}`, errorText)
      return NextResponse.json(
        {
          error: "Cron job execution failed",
          status: response.status,
          responseText: errorText.substring(0, 1000),
        },
        { status: 500 },
      )
    }

    const result = await response.json()
    return NextResponse.json({
      success: true,
      message: "Cron job executed successfully",
      result,
    })
  } catch (error: any) {
    console.error("Error running cron job:", error)
    return NextResponse.json(
      {
        error: "Error executing cron job",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
