import { NextRequest, NextResponse } from 'next/server'
import { createYoga } from 'graphql-yoga'
import { createClient } from '@/lib/supabase/server'
import { crmSchema } from '@/lib/graphql/crm/schema'
import { crmResolvers } from '@/lib/graphql/crm/resolvers'

/**
 * CRM GraphQL API Endpoint
 * Provides GraphQL interface for CRM operations
 */

// Create GraphQL Yoga server
const yoga = createYoga({
  schema: crmSchema,
  resolvers: crmResolvers,
  context: async (req: Request) => {
    // Get Supabase client
    const supabase = createClient()

    // Get user from auth
    let user = null
    if (supabase) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    }

    return {
      user: user ? {
        id: user.id,
        email: user.email || '',
      } : null,
      supabase,
    }
  },
  // Enable GraphQL Playground in development
  graphqlEndpoint: '/api/crm/graphql',
  graphiql: process.env.NODE_ENV === 'development',
})

export async function GET(request: NextRequest) {
  return yoga.handleRequest(request)
}

export async function POST(request: NextRequest) {
  return yoga.handleRequest(request)
}

