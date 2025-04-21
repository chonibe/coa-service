import { type NextRequest, NextResponse } from "next/server"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  try {
    // Build the cron job URL using the request origin directly
    const origin = request.nextUrl.origin
    const cronUrl = `${origin}/api/cron/sync-shopify-orders?secret=${CRON_SECRET}`

    console.log("==== TEST CRON ENDPOINT CALLED ====")
    console.log("Request URL:", request.url)
    console.log("Request origin:", origin)
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "Not set")
    console.log(`Manually triggering cron job at: ${new Date().toISOString()}`)
    console.log(`Calling: ${cronUrl.replace(CRON_SECRET || "", "REDACTED")}`)

    // Call the cron job endpoint
    const response = await fetch(cronUrl, {
      // Add a longer timeout for the request
      signal: AbortSignal.timeout(60000), // 60 second timeout
    })

    if (!response.ok) {
      let errorText = ""
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = "Could not read response text"
      }

      console.error(`Failed to trigger cron job: ${response.status} ${response.statusText}`)
      console.error(`Response body: ${errorText.substring(0, 500)}`)

      throw new Error(`Failed to trigger cron job: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: "Cron job triggered successfully",
      result,
    })
  } catch (error: any) {
    console.error("Error triggering cron job:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to trigger cron job",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
