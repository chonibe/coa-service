import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Enhanced redirect path extraction function
function normalizeRedirectPath(rawRedirectPath: string | null): string {
  if (!rawRedirectPath) return '/customer/dashboard';

  // Try to extract customer ID from various URL formats
  const customerIdPatterns = [
    /\/dashboard\/(\d+)/, // Matches /dashboard/6435402285283
    /\/customer\/dashboard\/(\d+)/, // Matches /customer/dashboard/6435402285283
    /\/(\d+)$/ // Matches URLs ending with a number
  ];

  for (const pattern of customerIdPatterns) {
    const match = rawRedirectPath.match(pattern);
    if (match && match[1]) {
      console.log('🔍 Customer ID found in redirect path:', match[1]);
      return `/dashboard/${match[1]}`;
    }
  }

  // If no customer ID found, return default or original path
  return rawRedirectPath.startsWith('/dashboard/') 
    ? rawRedirectPath 
    : `/customer/dashboard`;
}

export async function GET(request: NextRequest) {
  try {
    // Enhanced redirect path normalization
    const rawRedirectPath = request.nextUrl.searchParams.get('redirect') || '/customer/dashboard'
    const redirectPath = normalizeRedirectPath(rawRedirectPath);

    // Log debug information about redirect path
    console.log('Redirect Path Processing:', {
      rawRedirectPath,
      normalizedRedirectPath: redirectPath
    });

    // Check if user is already authenticated
    const existingCustomerId = request.cookies.get('shopify_customer_id')?.value
    const existingCustomerAccessToken = request.cookies.get('shopify_customer_access_token')?.value

    // If already authenticated, redirect to the requested dashboard path
    if (existingCustomerId && existingCustomerAccessToken) {
      console.log('User already authenticated, redirecting', {
        customerId: existingCustomerId,
        redirectPath
      });

      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Ensure these are set in your .env file
    const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Generate a secure state to prevent CSRF
    const state = crypto.randomBytes(16).toString('hex');

    // Create the redirect URL back to our app
    const redirectBackUrl = `${appUrl}/api/auth/callback`;
    
    // Create login URL with comprehensive redirect handling
    const loginUrl = new URL(`https://${shopDomain}/account/login`);
    
    // Create a return URL that includes all necessary authentication context
    const returnUrl = `/pages/street-collector-customer-redirect?redirect_uri=${encodeURIComponent(redirectBackUrl)}&state=${state}&redirect=${encodeURIComponent(redirectPath)}`;
    
    loginUrl.searchParams.set('return_url', returnUrl);

    // Set state in a cookie for verification
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15 // 15 minutes
    });

    // Store the original redirect path for callback use
    response.cookies.set('shopify_login_redirect', redirectPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15 // 15 minutes
    });

    return response;
  } catch (error) {
    console.error('Shopify Authentication Error:', error);
    
    // Fallback error handling
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 