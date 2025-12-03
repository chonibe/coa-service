import { NextRequest, NextResponse } from 'next/server'

/**
 * CRM GraphQL API Endpoint
 * Temporarily disabled due to build issues with GraphQL Yoga in Next.js
 * Will be re-enabled after fixing schema/resolver integration
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'GraphQL API is temporarily disabled. Please use REST API endpoints.' },
    { status: 503 }
  )
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'GraphQL API is temporarily disabled. Please use REST API endpoints.' },
    { status: 503 }
  )
}
