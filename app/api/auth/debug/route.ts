import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Collect all authentication-related cookies
    const cookies = {
      shopifyCustomerId: request.cookies.get('shopify_customer_id')?.value,
      shopifyCustomerAccessToken: request.cookies.get('shopify_customer_access_token')?.value,
      shopifyCustomerLogin: request.cookies.get('shopify_customer_login')?.value,
      shopifyLoginRedirect: request.cookies.get('shopify_login_redirect')?.value
    };

    // Collect request details
    const requestDetails = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      searchParams: Object.fromEntries(new URL(request.url).searchParams.entries())
    };

    // Comprehensive authentication debug response
    return NextResponse.json({
      success: true,
      message: 'Authentication Debug Information',
      cookies,
      requestDetails,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
        shopifyShop: process.env.SHOPIFY_SHOP
      }
    });
  } catch (error) {
    console.error('Authentication Debug Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 