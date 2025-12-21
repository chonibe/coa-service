import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    // Ensure these are set in your .env file
    const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Generate a secure state to prevent CSRF
    const state = crypto.randomBytes(16).toString('hex');

    // Create the redirect URL back to our app
    const redirectBackUrl = `${appUrl}/api/auth/callback`;
    
    // Try a simpler approach - redirect directly to Shopify account login
    // with a return URL that includes our callback information
    const loginUrl = new URL(`https://${shopDomain}/account/login`);
    
    // Create a return URL that will work with Shopify's default behavior
    const returnUrl = `/pages/street-collector-auth?redirect_uri=${encodeURIComponent(redirectBackUrl)}&state=${state}`;
    loginUrl.searchParams.set('return_url', returnUrl);

    console.log('Shopify Auth Debug:', {
      shopDomain,
      appUrl,
      redirectBackUrl,
      returnUrl,
      fullLoginUrl: loginUrl.toString()
    });

    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const postLoginRedirect = redirectParam || '/collector/dashboard';

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