import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to get the correct redirect URI based on environment
function getRedirectUri() {
  // Prioritize environment variables
  const baseUrls = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'https://streetcollector.com'
  ].filter(Boolean)

  // Try each base URL
  for (const baseUrl of baseUrls) {
    const redirectUri = `${baseUrl}/auth/callback`
    console.log(`Attempting redirect URI: ${redirectUri}`)
    return redirectUri
  }

  throw new Error('No valid redirect URI could be generated')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Log all relevant environment variables
    console.log('Environment Variables:', {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV
    })

    const redirectUri = getRedirectUri()
    console.log('Final Redirect URI:', redirectUri)

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
    response.cookies.set('customer_id', userInfo.customer_id || userInfo.sub, cookieOptions)

    // Upsert customer record
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .upsert({
        user_id: userInfo.sub, // Assuming sub is the unique identifier
        shopify_customer_id: userInfo.customer_id,
        // Add any other relevant customer information
        metadata: {
          source: 'street_lamp_oauth',
          last_login: new Date().toISOString()
        }
      }, {
        onConflict: 'user_id' // Update if user_id already exists
      })

    if (customerError) {
      console.error('Customer Upsert Error:', customerError)
      // Non-critical, so we'll continue with the authentication flow
    }

    return response

  } catch (error) {
    console.error('Comprehensive Redirect URI Error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 