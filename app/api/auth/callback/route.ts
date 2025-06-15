import { NextRequest, NextResponse } from 'next/server';

// Enhanced customer ID extraction function
function extractCustomerIdFromRedirect(redirectPath: string | null): string | null {
  if (!redirectPath) return null;

  // Try different extraction patterns
  const patterns = [
    /\/dashboard\/(\d+)/, // Matches /dashboard/6435402285283
    /\/customer\/dashboard\/(\d+)/, // Matches /customer/dashboard/6435402285283
    /\/(\d+)$/ // Matches URLs ending with a number
  ];

  for (const pattern of patterns) {
    const match = redirectPath.match(pattern);
    if (match && match[1]) {
      console.log('🔍 Customer ID extracted:', match[1], 'from path:', redirectPath);
      return match[1];
    }
  }

  console.warn('❌ No customer ID found in redirect path:', redirectPath);
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state')
  const customerId = searchParams.get('customer_id')
  const customerAccessToken = searchParams.get('customer_access_token')
  const redirectFromParams = searchParams.get('redirect')

  // Enhanced customer ID extraction
  const extractedCustomerId = extractCustomerIdFromRedirect(redirectFromParams)

  // Comprehensive debug logging
  console.log('=== ENHANCED CALLBACK ROUTE DEBUG ===');
  console.log('Extracted Customer ID:', extractedCustomerId);
  console.log('Original Customer ID from Params:', customerId);
  console.log('Redirect Path:', redirectFromParams);
  console.log('Full URL:', request.url);
  console.log('Search Params:', Object.fromEntries(request.nextUrl.searchParams));
  console.log('Headers:', {
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    userAgent: request.headers.get('user-agent')
  });
  console.log('Cookies:', {
    shopifyOAuthState: request.cookies.get('shopify_oauth_state')?.value,
    shopifyLoginRedirect: request.cookies.get('shopify_login_redirect')?.value
  });

  // Get stored state for validation
  const storedState = request.cookies.get('shopify_oauth_state')?.value
  
  // More lenient state validation for development
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTestState = state === 'test' // Allow test state for development
  
  if (!isDevelopment && (!state || !storedState || state !== storedState)) {
    console.error('OAuth state validation failed', { 
      receivedState: state, 
      storedState,
      isDevelopment,
      isTestState
    });
    return NextResponse.json({ 
      error: 'Invalid OAuth state' 
    }, { status: 400 })
  }

  // In development, allow bypassing state validation if it's a test
  if (isDevelopment && isTestState) {
    console.log('🔧 Development mode: Allowing test state bypass');
  }

  try {
    // Prioritize extracted customer ID, then original customer ID
    const finalCustomerId = extractedCustomerId || customerId

    // Determine the redirect path (prioritize from params, then cookies, then default)
    const redirectPath = redirectFromParams || 
      request.cookies.get('shopify_login_redirect')?.value || 
      '/dashboard';

    // Log debug information
    console.log('Callback processing:', {
      finalCustomerId,
      customerAccessToken,
      state,
      redirectPath
    });

    // If we have a customer ID, proceed with setting cookies
    if (finalCustomerId) {
      console.log('✅ Customer ID found, setting authentication cookies');
      
      // Construct full redirect URL
      const fullRedirectUrl = new URL(redirectPath, request.nextUrl.origin)

      // Redirect to customer dashboard
      const response = NextResponse.redirect(fullRedirectUrl);

      // Set authentication cookies
      response.cookies.set('shopify_customer_id', finalCustomerId, {
        httpOnly: false, // Allow JavaScript to read this cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      if (customerAccessToken) {
        response.cookies.set('shopify_customer_access_token', customerAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        });
      }

      response.cookies.set('shopify_customer_login', 'true', {
        httpOnly: false, // Allow client-side access for this flag
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });

      // Clear the state and redirect cookies
      response.cookies.delete('shopify_oauth_state');
      response.cookies.delete('shopify_login_redirect');

      console.log('🎉 Authentication successful, redirecting to:', fullRedirectUrl.toString());
      return response;
    }

    // If no customer ID, log and return error
    console.log('❌ No customer ID found in callback');
    return NextResponse.json({ 
      error: 'No customer information received',
      received: Object.fromEntries(searchParams)
    }, { status: 400 });

  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
} 