"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Pie } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Create a separate component for the analytics content
function AnalyticsContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("30")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shopifyData, setShopifyData] = useState<any>(null)
  const [googleData, setGoogleData] = useState<any>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        // Fetch Shopify analytics data
        const shopifyResponse = await fetch(`/api/analytics/shopify?days=${timeRange}`)
        const shopifyResult = await shopifyResponse.json()

        if (shopifyResponse.ok) {
          setShopifyData(shopifyResult)
        } else {
          setError(shopifyResult.error || "Failed to fetch Shopify analytics")
        }

        // Fetch Google analytics data
        const googleResponse = await fetch(`/api/analytics/google?days=${timeRange}`)
        const googleResult = await googleResponse.json()

        if (googleResponse.ok) {
          setGoogleData(googleResult)
        } else {
          // We don't set an error here as Google Analytics might not be configured
          console.warn("Google Analytics data fetch issue:", googleResult.error)
        }
      } catch (err) {
        setError("Failed to fetch analytics data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="180">Last 6 months</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-7 w-full mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${shopifyData?.overview?.totalRevenue?.toFixed(2) || "0.00"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shopifyData?.overview?.revenueChange > 0 ? "+" : ""}
                      {shopifyData?.overview?.revenueChange?.toFixed(2)}% from previous period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{shopifyData?.overview?.totalOrders || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {shopifyData?.overview?.ordersChange > 0 ? "+" : ""}
                      {shopifyData?.overview?.ordersChange?.toFixed(2)}% from previous period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {googleData?.isConfigured
                        ? googleData?.traffic?.reduce((sum: number, day: any) => sum + day.pageViews, 0) || 0
                        : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {!googleData?.isConfigured && "Google Analytics not configured"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {shopifyData?.overview?.conversionRate?.toFixed(2) || "0.00"}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {shopifyData?.overview?.conversionChange > 0 ? "+" : ""}
                      {shopifyData?.overview?.conversionChange?.toFixed(2)}% from previous period
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Sales Over Time</CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : shopifyData?.salesOverTime ? (
                  <Line
                    data={{
                      labels: shopifyData.salesOverTime.map((day: any) => day.date),
                      datasets: [
                        {
                          label: "Revenue",
                          data: shopifyData.salesOverTime.map((day: any) => day.revenue),
                          borderColor: "rgb(99, 102, 241)",
                          backgroundColor: "rgba(99, 102, 241, 0.5)",
                          tension: 0.2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${value}`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No sales data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : shopifyData?.topProducts && shopifyData.topProducts.length > 0 ? (
                  <Bar
                    data={{
                      labels: shopifyData.topProducts.map((product: any) => product.title),
                      datasets: [
                        {
                          label: "Revenue",
                          data: shopifyData.topProducts.map((product: any) => product.revenue),
                          backgroundColor: "rgba(99, 102, 241, 0.8)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                      scales: {
                        x: {
                          beginAtZero: true,
                          ticks: {
                            callback: (value) => `$${value}`,
                          },
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No product data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {googleData?.isConfigured ? (
            <Card>
              <CardHeader>
                <CardTitle>Website Traffic</CardTitle>
                <CardDescription>Visitors and page views from Google Analytics</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : googleData?.traffic && googleData.traffic.length > 0 ? (
                  <Line
                    data={{
                      labels: googleData.traffic.map((day: any) => day.date),
                      datasets: [
                        {
                          label: "Page Views",
                          data: googleData.traffic.map((day: any) => day.pageViews),
                          borderColor: "rgb(99, 102, 241)",
                          backgroundColor: "rgba(99, 102, 241, 0.5)",
                          tension: 0.2,
                        },
                        {
                          label: "Visitors",
                          data: googleData.traffic.map((day: any) => day.users),
                          borderColor: "rgb(14, 165, 233)",
                          backgroundColor: "rgba(14, 165, 233, 0.5)",
                          tension: 0.2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No traffic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Google Analytics Not Configured</AlertTitle>
              <AlertDescription>
                To see website traffic data, please configure Google Analytics in your environment variables.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales tab content */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Detailed sales metrics for the selected period</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : shopifyData?.salesOverTime ? (
                <Line
                  data={{
                    labels: shopifyData.salesOverTime.map((day: any) => day.date),
                    datasets: [
                      {
                        label: "Revenue",
                        data: shopifyData.salesOverTime.map((day: any) => day.revenue),
                        borderColor: "rgb(99, 102, 241)",
                        backgroundColor: "rgba(99, 102, 241, 0.5)",
                        tension: 0.2,
                        yAxisID: "y",
                      },
                      {
                        label: "Orders",
                        data: shopifyData.salesOverTime.map((day: any) => day.orders),
                        borderColor: "rgb(14, 165, 233)",
                        backgroundColor: "rgba(14, 165, 233, 0.5)",
                        tension: 0.2,
                        yAxisID: "y1",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        type: "linear",
                        display: true,
                        position: "left",
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => `$${value}`,
                        },
                      },
                      y1: {
                        type: "linear",
                        display: true,
                        position: "right",
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No sales data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          {/* Traffic tab content */}
          {googleData?.isConfigured ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Website Traffic</CardTitle>
                  <CardDescription>Visitors and page views over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : googleData?.traffic && googleData.traffic.length > 0 ? (
                    <Line
                      data={{
                        labels: googleData.traffic.map((day: any) => day.date),
                        datasets: [
                          {
                            label: "Page Views",
                            data: googleData.traffic.map((day: any) => day.pageViews),
                            borderColor: "rgb(99, 102, 241)",
                            backgroundColor: "rgba(99, 102, 241, 0.5)",
                            tension: 0.2,
                          },
                          {
                            label: "Visitors",
                            data: googleData.traffic.map((day: any) => day.users),
                            borderColor: "rgb(14, 165, 233)",
                            backgroundColor: "rgba(14, 165, 233, 0.5)",
                            tension: 0.2,
                          },
                          {
                            label: "Sessions",
                            data: googleData.traffic.map((day: any) => day.sessions),
                            borderColor: "rgb(249, 115, 22)",
                            backgroundColor: "rgba(249, 115, 22, 0.5)",
                            tension: 0.2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No traffic data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bounce Rate</CardTitle>
                  <CardDescription>
                    Percentage of visitors who navigate away after viewing only one page
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {loading ? (
                    <Skeleton className="h-full w-full" />
                  ) : googleData?.traffic && googleData.traffic.length > 0 ? (
                    <Line
                      data={{
                        labels: googleData.traffic.map((day: any) => day.date),
                        datasets: [
                          {
                            label: "Bounce Rate",
                            data: googleData.traffic.map((day: any) => day.bounceRate),
                            borderColor: "rgb(239, 68, 68)",
                            backgroundColor: "rgba(239, 68, 68, 0.5)",
                            tension: 0.2,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value: any) => `${value}%`,
                            },
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No bounce rate data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Google Analytics Not Configured</AlertTitle>
              <AlertDescription>
                To see website traffic data, please configure Google Analytics in your environment variables.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {/* Products tab content */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Sales and views by product</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : shopifyData?.topProducts && shopifyData.topProducts.length > 0 ? (
                <Bar
                  data={{
                    labels: shopifyData.topProducts.map((product: any) => product.title),
                    datasets: [
                      {
                        label: "Revenue",
                        data: shopifyData.topProducts.map((product: any) => product.revenue),
                        backgroundColor: "rgba(99, 102, 241, 0.8)",
                      },
                      {
                        label: "Units Sold",
                        data: shopifyData.topProducts.map((product: any) => product.unitsSold),
                        backgroundColor: "rgba(14, 165, 233, 0.8)",
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No product data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {googleData?.isConfigured && (
            <Card>
              <CardHeader>
                <CardTitle>Product Page Views</CardTitle>
                <CardDescription>Most viewed products from Google Analytics</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : googleData?.productViews && googleData.productViews.length > 0 ? (
                  <Bar
                    data={{
                      labels: googleData.productViews.map((product: any) =>
                        product.pageTitle.length > 30 ? product.pageTitle.substring(0, 30) + "..." : product.pageTitle,
                      ),
                      datasets: [
                        {
                          label: "Page Views",
                          data: googleData.productViews.map((product: any) => product.pageViews),
                          backgroundColor: "rgba(99, 102, 241, 0.8)",
                        },
                        {
                          label: "Unique Visitors",
                          data: googleData.productViews.map((product: any) => product.users),
                          backgroundColor: "rgba(14, 165, 233, 0.8)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: "y",
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No product view data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="geography" className="space-y-4">
          {/* Geography tab content */}
          {googleData?.isConfigured ? (
            <Card>
              <CardHeader>
                <CardTitle>Visitor Geography</CardTitle>
                <CardDescription>Visitors by country</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : googleData?.geography && googleData.geography.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4 h-full">
                    <div>
                      <Pie
                        data={{
                          labels: googleData.geography.map((geo: any) => geo.country),
                          datasets: [
                            {
                              data: googleData.geography.map((geo: any) => geo.users),
                              backgroundColor: [
                                "rgba(99, 102, 241, 0.8)",
                                "rgba(14, 165, 233, 0.8)",
                                "rgba(249, 115, 22, 0.8)",
                                "rgba(236, 72, 153, 0.8)",
                                "rgba(16, 185, 129, 0.8)",
                                "rgba(139, 92, 246, 0.8)",
                                "rgba(245, 158, 11, 0.8)",
                                "rgba(6, 182, 212, 0.8)",
                                "rgba(168, 85, 247, 0.8)",
                                "rgba(59, 130, 246, 0.8)",
                              ],
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                      />
                    </div>
                    <div className="overflow-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left py-2">Country</th>
                            <th className="text-right py-2">Visitors</th>
                            <th className="text-right py-2">Sessions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {googleData.geography.map((geo: any, index: number) => (
                            <tr key={index} className="border-t">
                              <td className="py-2">{geo.country}</td>
                              <td className="text-right py-2">{geo.users}</td>
                              <td className="text-right py-2">{geo.sessions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No geographic data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Google Analytics Not Configured</AlertTitle>
              <AlertDescription>
                To see geographic data, please configure Google Analytics in your environment variables.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main component with Suspense boundary
export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading analytics dashboard...</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
