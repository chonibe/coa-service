// GA4 Data API Integration for programmatic insights
// This provides server-side access to GA4 data for custom dashboards and automated reporting

import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

const PROPERTY_ID = process.env.GOOGLE_ANALYTICS_PROPERTY_ID || 'properties/252918461'
const SERVICE_ACCOUNT_KEY_PATH = process.env.GA_SERVICE_ACCOUNT_KEY_PATH || './ga-service-account.json'

export interface GA4Query {
  dateRange: {
    startDate: string
    endDate: string
  }
  dimensions?: string[]
  metrics: string[]
  dimensionFilter?: any
  metricFilter?: any
  orderBy?: any[]
  limit?: number
}

export interface GA4Insight {
  title: string
  description: string
  data: any[]
  summary: Record<string, any>
  lastUpdated: string
}

class GA4DataService {
  private auth: GoogleAuth | null = null
  private analyticsData: any = null
  private propertyId: string
  private initialized: boolean = false
  private initPromise: Promise<void> | null = null

  constructor() {
    this.propertyId = PROPERTY_ID.replace('properties/', '')
    this.initPromise = this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🔍 Initializing GA4 Data Service...')
      console.log('- Property ID:', PROPERTY_ID)
      console.log('- Service Account Creds in env:', !!process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS)
      console.log('- Service Account Key Path:', SERVICE_ACCOUNT_KEY_PATH)

      // Try to load credentials from environment variable first (for Vercel deployment)
      if (process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS) {
        console.log('🔐 Loading GA4 credentials from environment variable...')
        try {
          const credentials = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_CREDENTIALS)
          console.log('✅ Credentials parsed successfully, client_email:', credentials.client_email)

          this.auth = new GoogleAuth({
            credentials: credentials,
            scopes: ['https://www.googleapis.com/auth/analytics.readonly']
          })
        } catch (parseError) {
          console.error('❌ Failed to parse GA4_SERVICE_ACCOUNT_CREDENTIALS:', parseError.message)
          this.initialized = false
          return
        }
      } else {
        // Fallback to file-based credentials (for local development)
        const fs = require('fs')
        console.log('📁 Checking for service account key file...')
        if (!fs.existsSync(SERVICE_ACCOUNT_KEY_PATH)) {
          console.warn('GA4 service account key not found. GA4 insights will be disabled.')
          console.warn('Set GA4_SERVICE_ACCOUNT_CREDENTIALS environment variable for Vercel deployment.')
          this.initialized = false
          return
        }

        console.log('✅ Service account key file found')
        this.auth = new GoogleAuth({
          keyFile: SERVICE_ACCOUNT_KEY_PATH,
          scopes: ['https://www.googleapis.com/auth/analytics.readonly']
        })
      }

      const { google } = require('googleapis')
      this.analyticsData = google.analyticsdata({
        version: 'v1beta',
        auth: this.auth
      })

      this.initialized = true
      console.log('✅ GA4 Data API initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize GA4 Data API:', error.message)
      console.error('Stack:', error.stack)
      this.initialized = false
    }
  }

  private async runReport(query: GA4Query) {
    // Wait for initialization to complete
    if (this.initPromise) {
      await this.initPromise
    }

    if (!this.initialized || !this.analyticsData) {
      throw new Error('GA4 Data API not initialized. Check your GA4_SERVICE_ACCOUNT_CREDENTIALS environment variable.')
    }

    const request = {
      property: `properties/${this.propertyId}`,
      requestBody: {
        dateRanges: [query.dateRange],
        dimensions: query.dimensions?.map(name => ({ name })),
        metrics: query.metrics.map(name => ({ name })),
        dimensionFilter: query.dimensionFilter,
        metricFilter: query.metricFilter,
        orderBys: query.orderBy,
        limit: query.limit || 100
      }
    }

    const response = await this.analyticsData.properties.runReport(request)
    return response.data
  }

  // Artist Performance Insights
  async getArtistPerformance(days: number = 90): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['itemBrand'],
      metrics: ['eventCount', 'totalRevenue'],
      orderBy: [{ metric: { metricName: 'totalRevenue' }, desc: true }],
      limit: 20
    }

    const data = await this.runReport(query)

    const summary = {
      totalArtists: data.rows?.length || 0,
      topArtist: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A',
      topRevenue: data.rows?.[0]?.metricValues?.[1]?.value || '0'
    }

    return {
      title: 'Artist Performance',
      description: `Revenue and activity by artist (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Collection Performance Insights
  async getCollectionPerformance(days: number = 90): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['itemCategory'],
      metrics: ['eventCount', 'totalRevenue', 'ecommercePurchases'],
      orderBy: [{ metric: { metricName: 'totalRevenue' }, desc: true }],
      limit: 20
    }

    const data = await this.runReport(query)

    const totalRevenue = data.rows?.reduce((sum, row) =>
      sum + parseFloat(row.metricValues?.[1]?.value || '0'), 0) || 0

    const summary = {
      totalCollections: data.rows?.length || 0,
      topCollection: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A',
      totalRevenue: totalRevenue.toFixed(2)
    }

    return {
      title: 'Collection Performance',
      description: `Performance by collection/season (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Traffic Source Analysis
  async getTrafficSourceAnalysis(days: number = 30): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['firstUserSourceMedium'],
      metrics: ['sessions', 'totalRevenue', 'ecommercePurchases', 'ecommerceConversionRate'],
      orderBy: [{ metric: { metricName: 'totalRevenue' }, desc: true }],
      limit: 10
    }

    const data = await this.runReport(query)

    const summary = {
      totalSources: data.rows?.length || 0,
      bestSource: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A',
      bestRevenue: data.rows?.[0]?.metricValues?.[1]?.value || '0'
    }

    return {
      title: 'Traffic Source Performance',
      description: `Revenue and conversion by traffic source (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Customer Journey Funnel
  async getConversionFunnel(days: number = 30): Promise<GA4Insight> {
    // Get step-by-step funnel data
    const steps = [
      { name: 'session_start', display: 'Sessions' },
      { name: 'view_item', display: 'Product Views' },
      { name: 'add_to_cart', display: 'Add to Cart' },
      { name: 'begin_checkout', display: 'Begin Checkout' },
      { name: 'purchase', display: 'Purchases' }
    ]

    const funnelData = []

    for (const step of steps) {
      const query: GA4Query = {
        dateRange: {
          startDate: `${days}daysAgo`,
          endDate: 'yesterday'
        },
        dimensions: [],
        metrics: ['eventCount'],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: step.name
            }
          }
        }
      }

      const data = await this.runReport(query)
      const count = parseInt(data.rows?.[0]?.metricValues?.[0]?.value || '0')

      funnelData.push({
        step: step.display,
        count,
        percentage: 0 // Will calculate after all steps
      })
    }

    // Calculate percentages
    const totalSessions = funnelData[0].count
    funnelData.forEach(step => {
      step.percentage = totalSessions > 0 ? (step.count / totalSessions) * 100 : 0
    })

    const summary = {
      totalSessions: funnelData[0].count,
      conversionRate: funnelData[funnelData.length - 1].percentage,
      biggestDropoff: this.findBiggestDropoff(funnelData)
    }

    return {
      title: 'Conversion Funnel',
      description: `Customer journey from session to purchase (last ${days} days)`,
      data: funnelData,
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Geographic Performance
  async getGeographicPerformance(days: number = 90): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['country'],
      metrics: ['totalRevenue', 'ecommercePurchases', 'sessions'],
      orderBy: [{ metric: { metricName: 'totalRevenue' }, desc: true }],
      limit: 10
    }

    const data = await this.runReport(query)

    const summary = {
      totalCountries: data.rows?.length || 0,
      topCountry: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A',
      topRevenue: data.rows?.[0]?.metricValues?.[0]?.value || '0'
    }

    return {
      title: 'Geographic Performance',
      description: `Revenue by country (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Real-time Active Users
  async getRealtimeUsers(): Promise<GA4Insight> {
    // Wait for initialization to complete
    if (this.initPromise) {
      await this.initPromise
    }

    if (!this.initialized || !this.analyticsData) {
      throw new Error('GA4 Data API not initialized. Check your GA4_SERVICE_ACCOUNT_CREDENTIALS environment variable.')
    }

    const response = await this.analyticsData.properties.runRealtimeReport({
      property: `properties/${this.propertyId}`,
      requestBody: {
        metrics: [{ name: 'activeUsers' }],
        dimensions: [{ name: 'deviceCategory' }, { name: 'country' }]
      }
    })

    const summary = {
      totalActiveUsers: response.data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
      deviceBreakdown: this.groupByDevice(response.data.rows || [])
    }

    return {
      title: 'Real-time Active Users',
      description: 'Currently active users on your site',
      data: response.data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Cart Abandonment Analysis
  async getCartAbandonment(days: number = 7): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['date'],
      metrics: ['eventCount'],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { matchType: 'EXACT', value: 'add_to_cart' }
              }
            },
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: { matchType: 'EXACT', value: 'purchase' }
              }
            }
          ]
        }
      }
    }

    const data = await this.runReport(query)

    // Process data to calculate abandonment rates
    const processedData = this.processCartAbandonmentData(data.rows || [])

    const summary = {
      totalAddToCarts: processedData.reduce((sum, day) => sum + day.addToCart, 0),
      totalPurchases: processedData.reduce((sum, day) => sum + day.purchases, 0),
      averageAbandonmentRate: processedData.reduce((sum, day) => sum + day.abandonmentRate, 0) / processedData.length
    }

    return {
      title: 'Cart Abandonment Analysis',
      description: `Cart abandonment rates (last ${days} days)`,
      data: processedData,
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Helper methods
  private findBiggestDropoff(funnelData: any[]): string {
    let biggestDrop = 0
    let dropoffStep = ''

    for (let i = 1; i < funnelData.length; i++) {
      const drop = funnelData[i - 1].percentage - funnelData[i].percentage
      if (drop > biggestDrop) {
        biggestDrop = drop
        dropoffStep = `${funnelData[i - 1].step} → ${funnelData[i].step}`
      }
    }

    return dropoffStep
  }

  private groupByDevice(rows: any[]): Record<string, number> {
    const grouped: Record<string, number> = {}

    rows.forEach(row => {
      const device = row.dimensionValues?.[0]?.value || 'unknown'
      const users = parseInt(row.metricValues?.[0]?.value || '0')
      grouped[device] = (grouped[device] || 0) + users
    })

    return grouped
  }

  private processCartAbandonmentData(rows: any[]): any[] {
    const dailyData: Record<string, { addToCart: number, purchases: number }> = {}

    // Group events by date
    rows.forEach(row => {
      const date = row.dimensionValues?.[0]?.value
      const eventName = row.dimensionValues?.[1]?.value
      const count = parseInt(row.metricValues?.[0]?.value || '0')

      if (!dailyData[date]) {
        dailyData[date] = { addToCart: 0, purchases: 0 }
      }

      if (eventName === 'add_to_cart') {
        dailyData[date].addToCart += count
      } else if (eventName === 'purchase') {
        dailyData[date].purchases += count
      }
    })

    // Calculate abandonment rates
    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      addToCart: data.addToCart,
      purchases: data.purchases,
      abandonmentRate: data.addToCart > 0 ? ((data.addToCart - data.purchases) / data.addToCart) * 100 : 0
    }))
  }

  // Page View Analytics
  async getPageViewAnalytics(days: number = 30): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['pagePath', 'pageTitle'],
      metrics: ['screenPageViews', 'sessions', 'bounceRate', 'averageSessionDuration', 'eventCount'],
      orderBy: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20
    }

    const data = await this.runReport(query)

    const summary = {
      totalPageViews: data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
      totalSessions: data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[1]?.value || '0'), 0) || 0,
      topPage: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A'
    }

    return {
      title: 'Page View Analytics',
      description: `Most visited pages and their performance (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Event Analytics
  async getEventAnalytics(days: number = 30): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['eventName'],
      metrics: ['eventCount', 'totalUsers', 'eventValue'],
      orderBy: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 25
    }

    const data = await this.runReport(query)

    const summary = {
      totalEvents: data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
      totalUsers: data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[1]?.value || '0'), 0) || 0,
      topEvent: data.rows?.[0]?.dimensionValues?.[0]?.value || 'N/A'
    }

    return {
      title: 'Event Analytics',
      description: `All events and user interactions (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Enhanced Conversion Funnel with more steps
  async getEnhancedConversionFunnel(days: number = 30): Promise<GA4Insight> {
    // Get step-by-step funnel data including page views
    const steps = [
      { name: 'session_start', display: 'Sessions' },
      { name: 'page_view', display: 'Page Views' },
      { name: 'view_item', display: 'Product Views' },
      { name: 'add_to_cart', display: 'Add to Cart' },
      { name: 'begin_checkout', display: 'Begin Checkout' },
      { name: 'add_payment_info', display: 'Payment Info' },
      { name: 'purchase', display: 'Purchase Complete' }
    ]

    const funnelData = []

    for (const step of steps) {
      const query: GA4Query = {
        dateRange: {
          startDate: `${days}daysAgo`,
          endDate: 'yesterday'
        },
        dimensions: [],
        metrics: ['eventCount'],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: step.name
            }
          }
        }
      }

      const data = await this.runReport(query)
      const count = parseInt(data.rows?.[0]?.metricValues?.[0]?.value || '0')

      funnelData.push({
        step: step.display,
        count,
        percentage: 0, // Will calculate after all steps
        eventName: step.name
      })
    }

    // Calculate percentages relative to sessions
    const totalSessions = funnelData[0].count
    funnelData.forEach(step => {
      step.percentage = totalSessions > 0 ? (step.count / totalSessions) * 100 : 0
    })

    // Find biggest drop-offs
    let biggestDrop = 0
    let dropoffStep = ''
    for (let i = 1; i < funnelData.length; i++) {
      const drop = funnelData[i - 1].percentage - funnelData[i].percentage
      if (drop > biggestDrop) {
        biggestDrop = drop
        dropoffStep = `${funnelData[i - 1].step} → ${funnelData[i].step}`
      }
    }

    const summary = {
      totalSessions: funnelData[0].count,
      conversionRate: funnelData[funnelData.length - 1].percentage,
      biggestDropoff: dropoffStep,
      funnelSteps: funnelData.length
    }

    return {
      title: 'Enhanced Conversion Funnel',
      description: `Complete customer journey from session to purchase (last ${days} days)`,
      data: funnelData,
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Device and Technology Analytics
  async getDeviceAnalytics(days: number = 30): Promise<GA4Insight> {
    const query: GA4Query = {
      dateRange: {
        startDate: `${days}daysAgo`,
        endDate: 'yesterday'
      },
      dimensions: ['deviceCategory', 'operatingSystem', 'browser'],
      metrics: ['sessions', 'bounceRate', 'averageSessionDuration', 'totalRevenue'],
      orderBy: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 15
    }

    const data = await this.runReport(query)

    const summary = {
      totalSessions: data.rows?.reduce((sum, row) =>
        sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 0,
      avgBounceRate: data.rows?.length ? (data.rows.reduce((sum, row) =>
        sum + parseFloat(row.metricValues?.[1]?.value || '0'), 0) / data.rows.length) : 0
    }

    return {
      title: 'Device & Technology Analytics',
      description: `User devices, browsers, and operating systems (last ${days} days)`,
      data: data.rows || [],
      summary,
      lastUpdated: new Date().toISOString()
    }
  }

  // Get all insights at once (enhanced version)
  async getAllInsights(): Promise<Record<string, GA4Insight>> {
    // Wait for initialization to complete
    if (this.initPromise) {
      await this.initPromise
    }

    if (!this.initialized) {
      console.error('❌ GA4 service not initialized')
      throw new Error('GA4 Data API not initialized. Check your GA4_SERVICE_ACCOUNT_CREDENTIALS environment variable.')
    }

    console.log('🔍 Starting to fetch GA4 insights...')
    try {
      const [
        artistPerformance,
        collectionPerformance,
        trafficAnalysis,
        conversionFunnel,
        geographicPerformance,
        cartAbandonment,
        pageViews,
        events,
        enhancedFunnel,
        devices,
        realtimeUsers
      ] = await Promise.all([
        this.getArtistPerformance().catch(err => {
          console.error('❌ Artist performance failed:', err.message)
          return null
        }),
        this.getCollectionPerformance().catch(err => {
          console.error('❌ Collection performance failed:', err.message)
          return null
        }),
        this.getTrafficSourceAnalysis().catch(err => {
          console.error('❌ Traffic analysis failed:', err.message)
          return null
        }),
        this.getConversionFunnel().catch(err => {
          console.error('❌ Conversion funnel failed:', err.message)
          return null
        }),
        this.getGeographicPerformance().catch(err => {
          console.error('❌ Geographic performance failed:', err.message)
          return null
        }),
        this.getCartAbandonment().catch(err => {
          console.error('❌ Cart abandonment failed:', err.message)
          return null
        }),
        this.getPageViewAnalytics().catch(err => {
          console.error('❌ Page view analytics failed:', err.message)
          return null
        }),
        this.getEventAnalytics().catch(err => {
          console.error('❌ Event analytics failed:', err.message)
          return null
        }),
        this.getEnhancedConversionFunnel().catch(err => {
          console.error('❌ Enhanced funnel failed:', err.message)
          return null
        }),
        this.getDeviceAnalytics().catch(err => {
          console.error('❌ Device analytics failed:', err.message)
          return null
        }),
        this.getRealtimeUsers().catch(() => null) // Realtime might fail
      ])

      const result: Record<string, GA4Insight> = {}

      if (artistPerformance) result.artistPerformance = artistPerformance
      if (collectionPerformance) result.collectionPerformance = collectionPerformance
      if (trafficAnalysis) result.trafficAnalysis = trafficAnalysis
      if (conversionFunnel) result.conversionFunnel = conversionFunnel
      if (geographicPerformance) result.geographicPerformance = geographicPerformance
      if (cartAbandonment) result.cartAbandonment = cartAbandonment
      if (pageViews) result.pageViews = pageViews
      if (events) result.events = events
      if (enhancedFunnel) result.enhancedFunnel = enhancedFunnel
      if (devices) result.devices = devices
      if (realtimeUsers) result.realtimeUsers = realtimeUsers

      console.log(`✅ GA4 insights fetched successfully, ${Object.keys(result).length} insights returned`)
      return result
    } catch (error) {
      console.error('Error fetching GA4 insights:', error)
      throw error
    }
  }
}

// Export singleton instance
export const ga4DataService = new GA4DataService()
export default ga4DataService