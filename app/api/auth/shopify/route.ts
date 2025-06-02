import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  console.log('Shopify Auth Route Called');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
  });

  // Always use localhost for local development
  const baseUrl = 'http://localhost:3000';
  
  // Construct the dashboard URL
  const dashboardUrl = new URL('/customer/dashboard', baseUrl);

  console.log('Redirecting to:', dashboardUrl.toString());

  // Create a response with a redirect to the dashboard
  const response = NextResponse.redirect(dashboardUrl.toString());

  // Set an authentication cookie
  response.cookies.set('customer_auth_token', crypto.randomBytes(32).toString('hex'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  });

  // Set a flag to indicate authentication attempt
  response.cookies.set('customer_login_attempt', 'true', {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5 // 5 minutes
  });

  return response;
} 