import { NextRequest, NextResponse } from 'next/server'

const MOCK_EMAIL = 'streets@streets.com'
const COOKIE_NAME = 'mock_user_email'

/**
 * Dev-only: Set mock user cookie and redirect.
 * Enables viewing /shop/account and login flow as streets@streets.com without real auth.
 * Only active when NODE_ENV=development or MOCK_LOGIN_ENABLED=true.
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'
  if (!isDev && !mockEnabled) {
    return NextResponse.json({ error: 'Mock login disabled' }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email') || MOCK_EMAIL
  const redirectTo = searchParams.get('redirect') || '/shop/account'

  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set(COOKIE_NAME, email, {
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
