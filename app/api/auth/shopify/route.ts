import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate a secure state parameter to prevent CSRF
function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function GET(request: NextRequest) {
  // Get the base URL of the application
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Construct the dashboard URL
  const dashboardUrl = new URL('/customer/dashboard', baseUrl);

  // Redirect directly to the dashboard
  return NextResponse.redirect(dashboardUrl.toString());
} 