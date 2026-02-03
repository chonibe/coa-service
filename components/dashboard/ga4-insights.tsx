'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Skeleton, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger, Button } from '@/components/ui'
// Card imports consolidated below
// Badge import consolidated below
// Skeleton import consolidated below
// Alert imports consolidated below
// Tabs imports consolidated below
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Eye,
  AlertCircle,
  RefreshCw,
  Globe,
  Activity,
  Smartphone,
  Monitor,
  BarChart3
} from 'lucide-react'
// Button import consolidated below

interface GA4Insight {
  title: string
  description: string
  data: any[]
  summary: Record<string, any>
  lastUpdated: string
}

interface GA4InsightsProps {
  refreshInterval?: number // in minutes
  showRealtime?: boolean
}

export function GA4Insights({ refreshInterval = 30, showRealtime = true }: GA4InsightsProps) {
  const [insights, setInsights] = useState<Record<string, GA4Insight> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/ga4/insights', {
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // Check if GA4 is not configured (503 status)
        if (response.status === 503) {
          throw new Error(errorData.error || 'GA4 is not configured yet. Please complete the GA4 setup first.')
        }
        
        throw new Error(`Failed to fetch insights: ${response.status}`)
      }

      const data = await response.json()
      setInsights(data)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching GA4 insights:', err)
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()

    // Set up auto-refresh
    const interval = setInterval(fetchInsights, refreshInterval * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (loading && !insights) {
    return <InsightsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">{error}</p>
            {error.includes('not configured') && (
              <div className="text-sm">
                <p className="mb-2">To enable GA4 insights:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Run <code className="bg-muted px-1 py-0.5 rounded">npm run setup:ga4</code></li>
                  <li>Or follow the manual setup guide in <code className="bg-muted px-1 py-0.5 rounded">docs/GA4_SETUP_GUIDE.md</code></li>
                </ol>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            className="ml-2 mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!insights) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">GA4 Comprehensive Analytics</h2>
          <p className="text-muted-foreground">
            Complete website analytics, events, and conversion tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="funnel" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Funnel</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(insights.collectionPerformance?.summary?.totalRevenue || 0)}
              icon={DollarSign}
            />
            <MetricCard
              title="Active Sessions"
              value={insights.realtimeUsers?.summary?.totalActiveUsers?.toString() || '0'}
              icon={Users}
            />
            <MetricCard
              title="Conversion Rate"
              value={formatPercentage(insights.conversionFunnel?.summary?.conversionRate || 0)}
              icon={TrendingUp}
            />
            <MetricCard
              title="Cart Abandonment"
              value={formatPercentage(insights.cartAbandonment?.summary?.averageAbandonmentRate || 0)}
              icon={ShoppingCart}
            />
          </div>

      {/* Main Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Artist Performance */}
        <InsightCard
          insight={insights.artistPerformance}
          renderContent={(data) => (
            <div className="space-y-3">
              {data.slice(0, 5).map((artist: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <span className="font-medium">
                      {artist.dimensionValues?.[0]?.value || 'Unknown Artist'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(artist.metricValues?.[1]?.value || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(artist.metricValues?.[0]?.value || 0)} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />

        {/* Collection Performance */}
        <InsightCard
          insight={insights.collectionPerformance}
          renderContent={(data) => (
            <div className="space-y-3">
              {data.slice(0, 5).map((collection: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <span className="font-medium">
                      {collection.dimensionValues?.[0]?.value || 'Unknown Collection'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(collection.metricValues?.[1]?.value || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(collection.metricValues?.[2]?.value || 0)} sales
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />

        {/* Conversion Funnel */}
        <InsightCard
          insight={insights.conversionFunnel}
          renderContent={(data) => (
            <div className="space-y-2">
              {data.map((step: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{step.step}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatNumber(step.count)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {formatPercentage(step.percentage)}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  Biggest drop-off: {insights.conversionFunnel?.summary?.biggestDropoff || 'N/A'}
                </div>
              </div>
            </div>
          )}
        />

        {/* Traffic Sources */}
        <InsightCard
          insight={insights.trafficAnalysis}
          renderContent={(data) => (
            <div className="space-y-3">
              {data.slice(0, 5).map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">#{index + 1}</Badge>
                    <span className="text-sm font-medium truncate">
                      {source.dimensionValues?.[0]?.value || 'Unknown Source'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(source.metricValues?.[1]?.value || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPercentage(parseFloat(source.metricValues?.[3]?.value || '0'))} conv.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />

        {/* Geographic Performance */}
        <InsightCard
          insight={insights.geographicPerformance}
          renderContent={(data) => (
            <div className="space-y-3">
              {data.slice(0, 5).map((country: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <span className="font-medium">
                      {country.dimensionValues?.[0]?.value || 'Unknown Country'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(country.metricValues?.[0]?.value || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(country.metricValues?.[1]?.value || 0)} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        />

        {/* Cart Abandonment */}
        <InsightCard
          insight={insights.cartAbandonment}
          renderContent={(data) => (
            <div className="space-y-3">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {formatPercentage(insights.cartAbandonment?.summary?.averageAbandonmentRate || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Average abandonment rate
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Add to Cart</span>
                  <span className="font-medium">
                    {formatNumber(insights.cartAbandonment?.summary?.totalAddToCarts || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Purchases</span>
                  <span className="font-medium">
                    {formatNumber(insights.cartAbandonment?.summary?.totalPurchases || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        />
      </div>

      {/* Real-time Users (if available) */}
      {showRealtime && insights.realtimeUsers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Real-time Active Users
            </CardTitle>
            <CardDescription>
              Currently active users on your site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {insights.realtimeUsers.summary?.totalActiveUsers || 0}
            </div>
            <div className="mt-4 space-y-2">
              {Object.entries(insights.realtimeUsers.summary?.deviceBreakdown || {}).map(
                ([device, count]) => (
                  <div key={device} className="flex items-center justify-between">
                    <span className="capitalize">{device}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <InsightCard
              insight={insights.pageViews}
              renderContent={(data) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.pageViews?.summary?.totalPageViews || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Views</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.pageViews?.summary?.totalSessions || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Sessions</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {data.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Pages</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Top Pages</h4>
                    {data.slice(0, 10).map((page: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {page.dimensionValues?.[1]?.value || page.dimensionValues?.[0]?.value || 'Unknown Page'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {page.dimensionValues?.[0]?.value}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-semibold">
                            {formatNumber(page.metricValues?.[0]?.value || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(page.metricValues?.[1]?.value || 0)} sessions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle>Page Performance Insights</CardTitle>
                <CardDescription>Key metrics and optimization opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Top Entry Page</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {insights.pageViews?.summary?.topPage || 'No data available'}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-green-900 dark:text-green-100">Optimization Tips</h4>
                    <ul className="text-sm text-green-700 dark:text-green-300 mt-1 space-y-1">
                      <li>• Focus on high-traffic pages</li>
                      <li>• Reduce bounce rates on key pages</li>
                      <li>• Improve page load times</li>
                      <li>• Enhance mobile experience</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <InsightCard
              insight={insights.events}
              renderContent={(data) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.events?.summary?.totalEvents || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Events</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.events?.summary?.totalUsers || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Active Users</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {data.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Event Types</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Top Events</h4>
                    {data.slice(0, 15).map((event: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">
                            {event.dimensionValues?.[0]?.value || 'Unknown Event'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatNumber(event.metricValues?.[0]?.value || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatNumber(event.metricValues?.[1]?.value || 0)} users
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle>Event Analysis</CardTitle>
                <CardDescription>User interaction patterns and behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Most Common Event</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                      {insights.events?.summary?.topEvent || 'No data available'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Event Categories</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>E-commerce Events</span>
                        <span className="font-medium">purchase, add_to_cart, view_item</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Engagement Events</span>
                        <span className="font-medium">page_view, user_engagement</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Custom Events</span>
                        <span className="font-medium">Varies by implementation</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <InsightCard
            insight={insights.enhancedFunnel}
            renderContent={(data) => (
              <div className="space-y-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold">
                    {formatPercentage(insights.enhancedFunnel?.summary?.conversionRate || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Overall conversion rate
                  </div>
                </div>

                <div className="space-y-4">
                  {data.map((step: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{step.step}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatNumber(step.count)} events
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPercentage(step.percentage)}
                        </div>
                        <div className="text-sm text-muted-foreground">of sessions</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-medium text-red-900 dark:text-red-100">Biggest Drop-off Point</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {insights.enhancedFunnel?.summary?.biggestDropoff || 'No significant drop-off detected'}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Focus optimization efforts here to improve conversion rates
                  </p>
                </div>
              </div>
            )}
          />
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <InsightCard
              insight={insights.devices}
              renderContent={(data) => (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">
                        {formatNumber(insights.devices?.summary?.totalSessions || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold">
                        {formatPercentage(insights.devices?.summary?.avgBounceRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Bounce Rate</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Device Breakdown</h4>
                    {data.slice(0, 10).map((device: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {device.dimensionValues?.[0]?.value === 'mobile' && <Smartphone className="h-4 w-4" />}
                          {device.dimensionValues?.[0]?.value === 'desktop' && <Monitor className="h-4 w-4" />}
                          {device.dimensionValues?.[0]?.value === 'tablet' && <Monitor className="h-4 w-4" />}
                          <div>
                            <div className="font-medium capitalize">
                              {device.dimensionValues?.[0]?.value || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {device.dimensionValues?.[1]?.value || 'Unknown OS'} • {device.dimensionValues?.[2]?.value || 'Unknown Browser'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatNumber(device.metricValues?.[0]?.value || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatPercentage(parseFloat(device.metricValues?.[1]?.value || '0'))} bounce
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle>Device Optimization</CardTitle>
                <CardDescription>Performance insights by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Mobile Optimization Priority</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Ensure mobile pages load quickly and are touch-friendly
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Key Metrics to Monitor</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Session Duration</span>
                        <span className="font-medium">Desktop vs Mobile</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Bounce Rate</span>
                        <span className="font-medium">Identify high-bounce devices</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Conversion Rate</span>
                        <span className="font-medium">By device category</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper Components
function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp
}: {
  title: string
  value: string
  icon: any
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        {trend && (
          <div className="flex items-center mt-4">
            {trendUp ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
            <span className="text-sm text-muted-foreground ml-1">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InsightCard({
  insight,
  renderContent
}: {
  insight?: GA4Insight
  renderContent: (data: any[]) => React.ReactNode
}) {
  if (!insight) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{insight.title}</CardTitle>
        <CardDescription>{insight.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent(insight.data)}
      </CardContent>
    </Card>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}