import { NextRequest, NextResponse } from 'next/server'
import { isValidRedirectPath } from '@/lib/auth/redirect-validation'

const COOKIE_NAME = 'mock_user_email'

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const rawRedirect = request.nextUrl.searchParams.get('redirect')
  const redirectTo = isValidRedirectPath(rawRedirect) ? rawRedirect : '/login?redirect=/shop/account'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))
  response.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return response
}
