import { NextRequest, NextResponse } from 'next/server';

// This is a test endpoint to simulate the Shopify customer authentication
// Use this for development testing when the Liquid template isn't set up yet
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state');
  
  // Simulate a customer ID for testing - you can change this to test different customers
  const testCustomerId = '23225839157634'; // Use one of the customer IDs from your data
  const testCustomerEmail = 'test@customer.com';

  console.log('Test Callback Debug:', {
    redirectUri,
    state,
    testCustomerId,
    searchParams: Object.fromEntries(searchParams)
  });

  if (!redirectUri || !state) {
    return NextResponse.json({ 
      error: 'Missing redirect_uri or state parameter' 
    }, { status: 400 });
  }

  try {
    // Construct the callback URL with test customer information
    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('customer_id', testCustomerId);
    callbackUrl.searchParams.set('customer_email', testCustomerEmail);
    callbackUrl.searchParams.set('state', state);

    console.log('Redirecting to:', callbackUrl.toString());

    // Redirect to the actual callback
    return NextResponse.redirect(callbackUrl.toString());

  } catch (error) {
    console.error('Test callback error:', error);
    return NextResponse.json({ 
      error: 'Test callback failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 