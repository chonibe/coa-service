import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/**
 * Returns the user's country code from Vercel geo headers (IP-based).
 * Header: x-vercel-ip-country (2-letter ISO, e.g. US, GB).
 * Falls back to null when running locally or when header is missing.
 */
export async function GET() {
  const headersList = await headers()
  const country = headersList.get('x-vercel-ip-country')?.toUpperCase()
  return NextResponse.json({ country: country || null })
}
