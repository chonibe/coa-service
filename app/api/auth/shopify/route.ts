import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  // Ensure these are set in your .env file
  const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard` 
    : 'http://localhost:3000/customer/dashboard';

  console.log('Shopify Login Redirect:', {
    shopDomain,
    dashboardUrl
  });

  // Construct the customer login URL with explicit return_to
  const authUrl = new URL(`https://${shopDomain}/account/login`);
  authUrl.searchParams.append('return_to', dashboardUrl);

  // Create a response that will redirect to the Shopify login page
  const response = NextResponse.redirect(authUrl.toString());

  // Set a cookie to track the intended post-login destination
  response.cookies.set('post_login_redirect', dashboardUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5 // 5 minutes
  });

  return response;
} 