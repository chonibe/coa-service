import { NextRequest, NextResponse } from 'next/server'

/**
 * Get client IP from request (supports proxies via x-forwarded-for, x-real-ip).
 * Used to exclude internal/team traffic from Google Analytics.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

/**
 * GET /api/analytics/internal-check
 * Returns whether the request is from an internal IP (to exclude from GA).
 * Set INTERNAL_IP_ADDRESSES in env (comma-separated) with your office/home IPs.
 */
export async function GET(request: NextRequest) {
  const internalIpsEnv = process.env.INTERNAL_IP_ADDRESSES
  if (!internalIpsEnv || internalIpsEnv.trim() === '') {
    return NextResponse.json({ internal: false })
  }

  const clientIp = getClientIp(request).toLowerCase()
  const internalIps = internalIpsEnv.split(',').map((ip) => ip.trim().toLowerCase()).filter(Boolean)

  const internal = internalIps.some((allowed) => {
    if (allowed === clientIp) return true
    // IPv6 from X-Forwarded-For may omit brackets; allow match either way
    const normalizedAllowed = allowed.replace(/^\[|\]$/g, '')
    const normalizedClient = clientIp.replace(/^\[|\]$/g, '')
    if (normalizedAllowed === normalizedClient) return true
    return false
  })

  return NextResponse.json({ internal })
}
