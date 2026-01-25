import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * Debug endpoint to check auth configuration
 * Access at: /api/auth/debug
 */
export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  
  const config = {
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelUrl: process.env.VERCEL_URL,
    cookies: allCookies.map(c => ({
      name: c.name,
      hasValue: !!c.value,
      valueLength: c.value?.length || 0
    })),
    requestUrl: request.url,
    requestOrigin: request.nextUrl.origin,
    headers: {
      host: request.headers.get('host'),
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent')
    }
  }
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    config
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
