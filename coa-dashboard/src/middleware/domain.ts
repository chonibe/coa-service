import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const path = request.nextUrl.pathname

  // Only handle root path
  if (path !== '/') {
    return NextResponse.next()
  }

  // Handle different domains
  if (hostname === 'dashboard.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/dashboard/welcome', request.url))
  }

  if (hostname === 'admin.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/admin', request.url))
  }

  if (hostname === 'artist.thestreetlamp.com') {
    return NextResponse.rewrite(new URL('/artist', request.url))
  }

  // Default to main site
  return NextResponse.redirect('https://www.thestreetlamp.com')
}

export const config = {
  matcher: '/',
} 