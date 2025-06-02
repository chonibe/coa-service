import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const shop = searchParams.get('shop')

  if (!code) {
    return NextResponse.redirect(new URL('/api/auth/shopify', request.url))
  }

  try {
    // Use the redirect URI from environment variables
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;

    // Ensure these are set in your .env file
    const clientId = process.env.SHOPIFY_CLIENT_ID
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json({ 
        error: 'Missing Shopify client configuration' 
      }, { status: 500 })
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    const tokenData = await tokenResponse.json();

    // Fetch customer information
    const customerResponse = await fetch(`https://${shop}/admin/api/2023-10/customers.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
        'Content-Type': 'application/json'
      }
    });

    const customerData = await customerResponse.json();

    // Fetch shop information as a fallback
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': tokenData.access_token,
        'Content-Type': 'application/json'
      }
    });

    const shopData = await shopResponse.json();

    // Prepare the response with a redirect
    const response = NextResponse.redirect(new URL('/customer/dashboard', request.url));

    // Set cookies for customer ID and access token
    // Use shop ID as a fallback if customer ID is not available
    response.cookies.set('shopify_customer_id', 
      (customerData.customers && customerData.customers[0]?.id.toString()) || 
      shopData.shop.id.toString(), 
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }
    );

    response.cookies.set('shopify_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;

  } catch (error) {
    console.error('Shopify OAuth Error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete OAuth flow' 
    }, { status: 500 });
  }
} 