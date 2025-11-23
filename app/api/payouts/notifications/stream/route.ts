import { NextRequest } from "next/server"
import { guardAdminRequest } from "@/lib/auth-guards"
import { getVendorFromCookieStore } from "@/lib/vendor-session"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const vendorName = searchParams.get("vendorName")

  // Auth check
  if (vendorName) {
    const cookieStore = cookies()
    const sessionVendorName = getVendorFromCookieStore(cookieStore)
    if (sessionVendorName !== vendorName) {
      return new Response("Unauthorized", { status: 401 })
    }
  } else {
    const auth = guardAdminRequest(request)
    if (auth.kind !== "ok") {
      return new Response("Unauthorized", { status: 401 })
    }
  }

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      send({
        type: "connected",
        message: "Real-time updates connected",
        timestamp: new Date().toISOString(),
      })

      // Set up database change listener (using Supabase realtime or polling)
      // For now, we'll use a polling approach
      let lastCheck = new Date()

      const checkForUpdates = async () => {
        try {
          // In a real implementation, you would:
          // 1. Use Supabase Realtime subscriptions
          // 2. Or poll the database for changes
          // 3. Send notifications when changes are detected

          // For now, this is a placeholder that sends a heartbeat
          // In production, you'd check for actual payout status changes
          const now = new Date()
          if (now.getTime() - lastCheck.getTime() > 30000) {
            // Check every 30 seconds
            lastCheck = now
            // This would be replaced with actual change detection
          }
        } catch (error) {
          console.error("Error checking for updates:", error)
        }
      }

      // Poll for updates every 5 seconds
      const interval = setInterval(checkForUpdates, 5000)

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        send({
          type: "heartbeat",
          timestamp: new Date().toISOString(),
        })
      }, 30000) // Every 30 seconds

      // Cleanup on close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
    },
  })
}

