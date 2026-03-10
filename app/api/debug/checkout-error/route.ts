import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/debug/checkout-error
 *
 * Logs checkout/PayPal errors for debugging. Appears in Vercel deployment logs.
 * Call from client when checkout.confirm() fails or returns unexpected result.
 * Public (no auth) so real users can report errors during checkout.
 */
const MAX_BODY_SIZE = 2048

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()
    if (raw.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    const body = JSON.parse(raw) as Record<string, unknown>
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
