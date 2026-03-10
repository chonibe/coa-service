import { NextRequest, NextResponse } from 'next/server'
import { guardAdminRequest } from "@/lib/auth-guards"

/**
 * POST /api/debug/checkout-error
 *
 * Logs checkout/PayPal errors for debugging. Appears in Vercel deployment logs.
 * Call from client when checkout.confirm() fails or returns unexpected result.
 */
export async function POST(request: NextRequest) {
  const guardResult = guardAdminRequest(request)
  if (guardResult.kind !== "ok") {
    return guardResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { stage, resultType, error, message, hasRedirectUrl } = body as {
      stage?: string
      resultType?: string
      error?: string
      message?: string
      hasRedirectUrl?: boolean
    }

    const logLine = [
      '[Checkout Debug]',
      stage && `stage=${stage}`,
      resultType && `resultType=${resultType}`,
      hasRedirectUrl !== undefined && `hasRedirectUrl=${hasRedirectUrl}`,
      (error || message) && `msg=${error || message}`,
    ]
      .filter(Boolean)
      .join(' ')

    console.error(logLine)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
