import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  // Ensure these are set in your .env file
  const shopDomain = process.env.SHOPIFY_SHOP || 'thestreetlamp-9103.myshopify.com';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';

  // Generate state for CSRF protection
  const state = generateState();

  // Construct the customer login URL with dashboard redirect
  const authUrl = new URL(`https://${shopDomain}/account/login`);
  authUrl.searchParams.append('return_to', '/customer/dashboard');

  // Redirect to Shopify customer login page
  return NextResponse.redirect(authUrl.toString());
} 