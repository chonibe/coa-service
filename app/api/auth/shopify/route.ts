import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Ensure these are set in your .env file
    const shopDomain =
      process.env.SHOPIFY_STORE_DOMAIN ||
      process.env.SHOPIFY_SHOP ||
      'thestreetlamp-9103.myshopify.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Generate a secure state to prevent CSRF
    const state = crypto.randomBytes(16).toString('hex');

    // Create the redirect URL back to our app
    const redirectBackUrl = `${appUrl}/api/auth/callback`;
    
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const postLoginRedirect = redirectParam || '/collector/dashboard';

    // Build absolute return_url to storefront redirect page
    const returnUrl = `https://${shopDomain}/pages/street-collector-auth?redirect_uri=${encodeURIComponent(redirectBackUrl)}&state=${state}&redirect=${encodeURIComponent(postLoginRedirect)}`;

    // Redirect to Shopify account login with the return_url we control
    const loginUrl = new URL(`https://${shopDomain}/account/login`);
    loginUrl.searchParams.set('return_url', returnUrl);

    console.log('Shopify Auth Debug:', {
      shopDomain,
      appUrl,
      redirectBackUrl,
      returnUrl,
      fullLoginUrl: loginUrl.toString()
    });

    // Create a response that will redirect to the Shopify customer login page
    const response = NextResponse.redirect(loginUrl.toString());

    // Set state cookie for CSRF protection
    const cookieDomain = process.env.NODE_ENV === 'production' ? '.thestreetlamp.com' : undefined;

    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to 'lax' to allow cross-site redirects
      maxAge: 60 * 10, // 10 minutes
      domain: cookieDomain
    });

    // Set redirect destination cookie
    response.cookies.set('shopify_login_redirect', postLoginRedirect, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed to 'lax' to allow cross-site redirects
      maxAge: 60 * 10, // 10 minutes
      domain: cookieDomain
    });

    return response;

  } catch (error) {
    console.error('Shopify Customer Login Redirect Error:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate Shopify customer login',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 