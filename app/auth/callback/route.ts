import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Function to get the correct redirect URI based on environment
function getRedirectUri() {
  if (process.env.NODE_ENV === 'production') {
    return 'https://streetcollector.vercel.app/auth/callback'
  } else if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/auth/callback`
  } else {
    return 'http://localhost:3000/auth/callback'
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const redirectUri = getRedirectUri()

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://account.thestreetlamp.com/authentication/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: '594cf36a-179f-4227-821d-1dd00f778900',
        client_secret: process.env.STREET_LAMP_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code')
    }

    const tokenData = await tokenResponse.json()

    // Fetch user info
    const userInfoResponse = await fetch('https://account.thestreetlamp.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userInfoResponse.json()

    // Prepare cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: tokenData.expires_in
    }

    // Set cookies using NextResponse
    const response = NextResponse.redirect(
      new URL(`/customer/dashboard/${userInfo.customer_id || userInfo.sub}`, request.url)
    )

    // Set cookies on the response
    response.cookies.set('street_lamp_token', tokenData.access_token, cookieOptions)
    response.cookies.set('user_email', userInfo.email, cookieOptions)
    response.cookies.set('customer_id', userInfo.customer_id || userInfo.sub, cookieOptions)

    return response

  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 