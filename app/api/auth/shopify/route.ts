import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  // Log environment variables for debugging
  console.log('Environment Variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SHOPIFY_SHOP: process.env.SHOPIFY_SHOP
  });

  // Ensure these are set in your .env file
  const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
  
  // Prioritize local development
  const dashboardUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/customer/dashboard'
    : (process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/customer/dashboard` 
      : 'https://streetcollector.vercel.app/customer/dashboard');

  console.log('Shopify Login Redirect:', {
    shopDomain,
    dashboardUrl,
    nodeEnv: process.env.NODE_ENV,
    fullRedirectUrl: `https://${shopDomain}/account/login?return_to=${encodeURIComponent(dashboardUrl)}`
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