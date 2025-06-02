import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function sanitizeRedirectUri(baseUrl: string, path: string): string {
  // Remove trailing and leading slashes, then join with a single slash
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '')
  return `${cleanBaseUrl}/${cleanPath}`
}

function getRedirectUri(): string {
  // Prioritize environment-specific redirect URIs for Street Lamp
  const redirectUris = [
    process.env.NEXT_PUBLIC_VERCEL_REDIRECT_URI,
    process.env.NEXT_PUBLIC_PROD_REDIRECT_URI,
    process.env.NEXT_PUBLIC_LOCAL_REDIRECT_URI
  ].filter(Boolean)

  // Determine current environment with nuanced detection
  const isVercel = process.env.VERCEL === '1'
  const isProduction = process.env.NODE_ENV === 'production'
  const hasVercelUrl = !!process.env.VERCEL_URL

  let selectedRedirectUri: string | undefined

  // Prioritize based on environment
  if (isVercel || hasVercelUrl) {
    selectedRedirectUri = process.env.NEXT_PUBLIC_VERCEL_REDIRECT_URI
  } else if (isProduction) {
    selectedRedirectUri = process.env.NEXT_PUBLIC_PROD_REDIRECT_URI
  } else {
    // Default to local for development
    selectedRedirectUri = process.env.NEXT_PUBLIC_LOCAL_REDIRECT_URI
  }

  // Fallback and validation
  if (!selectedRedirectUri) {
    console.warn('No valid redirect URI could be determined')
    throw new Error('No valid redirect URI could be generated')
  }

  return selectedRedirectUri
}

export async function GET(request: NextRequest) {
  const shop = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com'

  try {
    // Hardcode the local dashboard URL for development
    const dashboardUrl = 'http://localhost:3000/customer/dashboard'

    console.log('Callback Route Redirect:', {
      dashboardUrl,
      requestUrl: request.url
    });

    // Construct a response that will redirect to the local dashboard
    const response = NextResponse.redirect(new URL(dashboardUrl))

    // Set a flag cookie to indicate successful Shopify login
    response.cookies.set('shopify_login_complete', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 5 // 5 minutes
    });

    return response

  } catch (error) {
    console.error('Authentication Redirect Error:', error)
    return NextResponse.redirect(new URL('http://localhost:3000/customer/dashboard'))
  }
} 