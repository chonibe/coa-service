import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'mock_user_email'

/**
 * Dev-only: Clear mock user cookie and redirect to login.
 */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/login?redirect=/shop/account'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return response
}
