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
  try {
    // Check for custom redirect from query parameters
    const { searchParams } = new URL(request.url)
    const customRedirect = searchParams.get('redirect')

    // Retrieve the stored redirect URL from cookies or use default
    const redirectUrl = customRedirect || 
      request.cookies.get('shopify_login_redirect')?.value || 
      'https://dashboard.thestreetlamp.com/customer/dashboard';

    console.log('Callback Route Redirect:', {
      redirectUrl,
      customRedirect,
      requestUrl: request.url
    });

    // Construct a response that will redirect to the dashboard
    const response = NextResponse.redirect(new URL(redirectUrl));

    // Clear the redirect cookie
    response.cookies.delete('shopify_login_redirect');

    return response;

  } catch (error) {
    console.error('Authentication Redirect Error:', error)
    return NextResponse.redirect(new URL('https://dashboard.thestreetlamp.com/customer/dashboard'))
  }
} 