import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract authentication parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const customerEmail = searchParams.get('customer_email');
    const state = searchParams.get('state');
    const redirectFromParams = searchParams.get('redirect');

    // Verify state to prevent CSRF
    const storedState = request.cookies.get('shopify_oauth_state')?.value;
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment && state !== storedState) {
      console.warn('⚠️ State mismatch - potential CSRF attempt', { 
        receivedState: state, 
        storedState 
      });
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Determine the redirect path (prioritize from params, then cookies, then default)
    const redirectPath = normalizeRedirectPath(
      redirectFromParams || 
      request.cookies.get('shopify_login_redirect')?.value || 
      '/dashboard'
    );

    // Log debug information
    console.log('Callback Processing', {
      customerId,
      customerEmail,
      state,
      storedState,
      isDevelopment,
      redirectPath
    });

    // Validate customer ID
    if (!customerId) {
      console.error('❌ No customer ID received');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Construct full redirect URL
    const fullRedirectUrl = new URL(redirectPath, request.nextUrl.origin);

    // Create response with authentication cookies
    const response = NextResponse.redirect(fullRedirectUrl);

    // Set customer ID cookie (accessible client-side)
    response.cookies.set('shopify_customer_id', customerId, {
      httpOnly: false, // Allow JavaScript to read this cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Optional: Set customer email cookie
    if (customerEmail) {
      response.cookies.set('shopify_customer_email', customerEmail, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    // Set login flag for client-side detection
    response.cookies.set('shopify_customer_login', 'true', {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    // Clear temporary authentication cookies
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_login_redirect');

    console.log('🎉 Authentication Successful', {
      redirectUrl: fullRedirectUrl.toString(),
      customerId
    });

    return response;
  } catch (error) {
    console.error('Authentication Callback Error:', error);
    
    // Fallback error handling
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Utility function to normalize redirect paths
function normalizeRedirectPath(path: string | null): string {
  if (!path) return '/dashboard';

  // Remove any potential double slashes
  path = path.replace(/\/+/g, '/');

  // Ensure path starts with /dashboard or /customer/dashboard
  if (!path.startsWith('/dashboard') && !path.startsWith('/customer/dashboard')) {
    return `/dashboard/${path.replace(/^\//, '')}`;
  }

  return path;
} 