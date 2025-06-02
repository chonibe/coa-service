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

  // Redirect directly to the dashboard
  return NextResponse.redirect(dashboardUrl.toString());
} 