import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const vendorName = getVendorFromCookieStore(cookieStore)

    if (!vendorName) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ids } = body

    if (!action || !ids || !Array.isArray(ids)) {
      return NextResponse.json(
        { error: "Invalid request. Provide action and ids array" },
        { status: 400 },
      )
    }

    const supabase = createClient()
    const sanitizedVendorName = vendorName.replace(/[^a-z0-9]/gi, "_").toLowerCase()

    if (action === "delete") {
      const results = []
      
      for (const id of ids) {
        try {
          // Decode ID to get bucket and path
          const decoded = Buffer.from(id, "base64").toString("utf-8")
          const [bucket, ...pathParts] = decoded.split(":")
          const path = pathParts.join(":")

          // Verify the path belongs to this vendor
          if (!path.includes(sanitizedVendorName)) {
            results.push({ id, success: false, error: "Unauthorized" })
            continue
          }

          // Delete the file
          const { error } = await supabase.storage.from(bucket).remove([path])

          if (error) {
            results.push({ id, success: false, error: error.message })
          } else {
            results.push({ id, success: true })
          }
        } catch (error: any) {
          results.push({ id, success: false, error: error.message })
        }
      }

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return NextResponse.json({
        success: true,
        results,
        summary: {
          total: ids.length,
          successful: successCount,
          failed: failureCount,
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Error performing bulk operation:", error)
    return NextResponse.json(
      { error: "Failed to perform bulk operation", message: error.message },
      { status: 500 },
    )
  }
}
