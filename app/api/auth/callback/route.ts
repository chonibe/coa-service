import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state')
  const customerId = searchParams.get('customer_id')
  const customerAccessToken = searchParams.get('customer_access_token')

  // Comprehensive debug logging
  console.log('=== CALLBACK ROUTE DEBUG ===');
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
    // Log debug information
    console.log('Callback processing:', {
      customerId,
      customerAccessToken,
      state,
      storedState,
      isDevelopment
    });

    // If we have customer_id, proceed with setting cookies
    if (customerId) {
      console.log('✅ Customer ID found, setting authentication cookies');
      
      // Redirect to customer dashboard
      const response = NextResponse.redirect(new URL('/customer/dashboard', request.url));

      // Set authentication cookies
      response.cookies.set('shopify_customer_id', customerId, {
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

      // Clear the state cookie
      response.cookies.delete('shopify_oauth_state');

      console.log('🎉 Authentication successful, redirecting to dashboard');
      return response;
    }

    // If no customer_id, this might be the first step of OAuth
    console.log('❌ No customer ID found in callback');
    return NextResponse.json({ 
      error: 'No customer information received',
      received: Object.fromEntries(searchParams)
    }, { status: 400 });

  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json({ 
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 