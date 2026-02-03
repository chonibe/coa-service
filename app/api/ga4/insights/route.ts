import { NextResponse } from 'next/server'
import { ga4DataService } from '@/lib/ga4-data-api'

// GA4 Insights API Route
// Provides programmatic access to GA4 data for custom dashboards

export async function GET(request: Request) {
  try {
    console.log('🔍 GA4 Insights API called')
    console.log('Environment check:')
    console.log('- GOOGLE_ANALYTICS_PROPERTY_ID:', process.env.GOOGLE_ANALYTICS_PROPERTY_ID)
    console.log('- GA_SERVICE_ACCOUNT_KEY_PATH:', process.env.GA_SERVICE_ACCOUNT_KEY_PATH)
    console.log('- GA4_SERVICE_ACCOUNT_CREDENTIALS exists:', !!process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS)
    
    // Check if GA4 is configured
    if (!process.env.GOOGLE_ANALYTICS_PROPERTY_ID) {
      return NextResponse.json(
        { 
          error: 'GA4 not configured. Missing GOOGLE_ANALYTICS_PROPERTY_ID.',
          help: 'Add GOOGLE_ANALYTICS_PROPERTY_ID to your .env.local file and restart the dev server.'
        },
        { status: 503 }
      )
    }

    // Check for service account credentials
    if (!process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS && !process.env.GA_SERVICE_ACCOUNT_KEY_PATH) {
      return NextResponse.json(
        { 
          error: 'GA4 service account credentials missing.',
          help: 'Set GA_SERVICE_ACCOUNT_KEY_PATH in .env.local or GA4_SERVICE_ACCOUNT_CREDENTIALS for production.'
        },
        { status: 503 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const includeRealtime = searchParams.get('realtime') !== 'false'

    console.log(`📊 Fetching GA4 insights for last ${days} days...`)

    // Fetch all insights
    const insights = await ga4DataService.getAllInsights()
    console.log('✅ GA4 insights fetched successfully, keys:', Object.keys(insights))

    // Add cache headers (cache for 5 minutes)
    const response = NextResponse.json(insights)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response

  } catch (error) {
    console.error('❌ Error fetching GA4 insights:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch GA4 insights',
        details: error instanceof Error ? error.message : 'Unknown error',
        configured: !!process.env.GOOGLE_ANALYTICS_PROPERTY_ID,
        help: 'Check server logs for detailed error information.'
      },
      { status: 503 }
    )
  }
}

// POST endpoint for custom queries (future enhancement)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, days = 30 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      )
    }

    // For now, return a placeholder response
    // In the future, this could execute custom GA4 queries
    return NextResponse.json({
      message: 'Custom queries not yet implemented',
      received: { query, days }
    })

  } catch (error) {
    console.error('❌ Error processing custom GA4 query:', error)

    return NextResponse.json(
      {
        error: 'Failed to process custom query',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}