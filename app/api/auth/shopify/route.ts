import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  // Ensure these are set in your .env file
  const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
  
  // Construct the customer login URL
  const authUrl = new URL(`https://${shopDomain}/account/login`);

  // Create a response that will redirect to the Shopify login page
  const response = NextResponse.redirect(authUrl.toString());

  // Set cookies to help with post-login tracking
  response.cookies.set('shopify_login_redirect', 'http://localhost:3000/customer/dashboard', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5 // 5 minutes
  });

  // Log for debugging
  console.log('Shopify Login Redirect Attempt:', {
    shopDomain,
    redirectUrl: authUrl.toString()
  });

  return response;
} 