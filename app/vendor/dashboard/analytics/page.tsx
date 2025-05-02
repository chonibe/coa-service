"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { AlertCircle, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { SidebarLayout } from "../../components/sidebar-layout"
import { formatCurrency } from "@/lib/utils"

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]

export default function AnalyticsDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "overview"

  const [timeRange, setTimeRange] = useState("30days")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/analytics/shopify?timeRange=${timeRange}`)

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/vendor/login")
            return
          }
          throw new Error(`Failed to fetch analytics data: ${response.status}`)
        }

        const data = await response.json()
        setAnalyticsData(data)
      } catch (err: any) {
        console.error("Error fetching analytics data:", err)
        setError(err.message || "Failed to load analytics data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [timeRange, router])

  // Handle tab change
  const handleTabChange = (newTab: string) => {
    router.push(`/vendor/dashboard/analytics?tab=${newTab.toLowerCase()}`)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center p-8 h-[calc(100vh-64px)]">
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading analytics...</h2>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your performance and sales insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="time-range" className="sr-only">
              Time Range
            </Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger id="time-range" className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="year">Last year</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{formatCurrency(analyticsData?.totalRevenue || 0)}</div>
                <div className="flex items-center text-sm font-medium text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  12%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{analyticsData?.totalSales || 0}</div>
                <div className="flex items-center text-sm font-medium text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  8%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {analyticsData?.analyticsData?.sessions?.[0]?.conversionRate || "3.2%"}
                </div>
                <div className="flex items-center text-sm font-medium text-red-500">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  0.5%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to previous period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    analyticsData?.totalSales ? analyticsData.totalRevenue / analyticsData.totalSales : 0,
                  )}
                </div>
                <div className="flex items-center text-sm font-medium text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  4%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to previous period</p>
            </CardContent>
          </Card>
        </div>

        {tab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Track your sales and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData?.salesData || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                          return [value, "Sales"]
                        }}
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Your best performing products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analyticsData?.topProducts || []).map((product: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{product.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{product.sales} sales</span>
                          <span className="font-medium">{formatCurrency(product.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Direct", value: 55 },
                            { name: "Social", value: 25 },
                            { name: "Email", value: 15 },
                            { name: "Affiliates", value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === "sales" && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Sales Analysis</CardTitle>
              <CardDescription>Comprehensive breakdown of your sales data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData?.salesData || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                        return [value, "Sales"]
                      }}
                      labelFormatter={formatDate}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "traffic" && (
          <Card>
            <CardHeader>
              <CardTitle>Traffic Analysis</CardTitle>
              <CardDescription>Visitor traffic and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={(analyticsData?.analyticsData?.sessions || []).map((session: any) => ({
                      date: session.date,
                      sessions: session.totalSessionsCount,
                      mobile: session.mobileSessionsCount,
                      desktop: session.desktopSessionsCount,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDate} />
                    <YAxis />
                    <Tooltip labelFormatter={formatDate} />
                    <Legend />
                    <Line type="monotone" dataKey="sessions" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="mobile" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="desktop" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "products" && (
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Detailed metrics for all your products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.topProducts || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="sales"
                      nameKey="title"
                      label={({ title, percent }) => `${title} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(analyticsData?.topProducts || []).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name, props) => [value, props.payload.title]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "geography" && (
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Where your customers are located</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <p className="text-muted-foreground">
                  Geographic data is not available from the current analytics source.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  )
}
