import { NextRequest, NextResponse } from 'next/server';

// Development-only endpoint to test customer authentication
// This bypasses Shopify and sets the cookies directly
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id') || '23225839157634'; // Default test customer
    
    console.log('Test Login Debug:', {
      customerId,
      origin: request.nextUrl.origin
    });

    // Redirect to customer dashboard
    const response = NextResponse.redirect(new URL('/customer/dashboard', request.url));

    // Set the customer cookies directly for testing
    response.cookies.set('shopify_customer_id', customerId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    response.cookies.set('shopify_customer_access_token', 'test_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    // Set login flag
    response.cookies.set('shopify_customer_login', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5 // 5 minutes
    });

    return response;

  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({ 
      error: 'Test login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 