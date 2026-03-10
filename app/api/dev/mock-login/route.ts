import { NextRequest, NextResponse } from 'next/server'
import { isValidRedirectPath } from '@/lib/auth/redirect-validation'

const MOCK_EMAIL = 'streets@streets.com'
const COOKIE_NAME = 'mock_user_email'

/**
 * Dev-only: Set mock user cookie and redirect.
 * Enables viewing /shop/account and login flow as streets@streets.com without real auth.
 * Never active in production - MOCK_LOGIN_ENABLED is ignored when NODE_ENV=production.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const mockEnabled = process.env.MOCK_LOGIN_ENABLED === 'true'
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev && !mockEnabled) {
    return NextResponse.json({ error: 'Mock login disabled' }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const email = searchParams.get('email') || MOCK_EMAIL
  const redirectParam = searchParams.get('redirect') || '/shop/account'
  const redirectTo = isValidRedirectPath(redirectParam) ? redirectParam : '/shop/account'

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
