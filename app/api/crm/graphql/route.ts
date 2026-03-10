import { guardAdminRequest } from "@/lib/auth-guards"
import { NextRequest, NextResponse } from 'next/server'

/**
 * CRM GraphQL API Endpoint
 * Temporarily disabled due to build issues with GraphQL Yoga in Next.js
 * Will be re-enabled after fixing schema/resolver integration
 */

export async function GET(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  return NextResponse.json(
    { error: 'GraphQL API is temporarily disabled. Please use REST API endpoints.' },
    { status: 503 }
  )
}

export async function POST(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  return NextResponse.json(
    { error: 'GraphQL API is temporarily disabled. Please use REST API endpoints.' },
    { status: 503 }
  )
}
