"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

// Sample data for charts
const salesData = [
  { name: "Jan", sales: 12, revenue: 1200 },
  { name: "Feb", sales: 19, revenue: 1900 },
  { name: "Mar", sales: 15, revenue: 1500 },
  { name: "Apr", sales: 27, revenue: 2700 },
  { name: "May", sales: 24, revenue: 2400 },
  { name: "Jun", sales: 32, revenue: 3200 },
  { name: "Jul", sales: 38, revenue: 3800 },
]

const visitorData = [
  { name: "Mon", visitors: 120 },
  { name: "Tue", visitors: 145 },
  { name: "Wed", visitors: 132 },
  { name: "Thu", visitors: 167 },
  { name: "Fri", visitors: 178 },
  { name: "Sat", visitors: 189 },
  { name: "Sun", visitors: 142 },
]

const productPerformanceData = [
  { name: "Product A", value: 35 },
  { name: "Product B", value: 25 },
  { name: "Product C", value: 20 },
  { name: "Product D", value: 15 },
  { name: "Others", value: 5 },
]

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"]

const geographicData = [
  { country: "USA", sales: 45 },
  { country: "UK", sales: 25 },
  { country: "Canada", sales: 15 },
  { country: "Australia", sales: 10 },
  { country: "Others", sales: 5 },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [vendor, setVendor] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30days")

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const response = await fetch("/api/vendor/profile")

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/vendor/login")
            return
          }
          throw new Error("Failed to fetch vendor data")
        }

        const data = await response.json()
        setVendor(data.vendor)

        // Simulate loading analytics data
        setTimeout(() => {
          setIsLoading(false)
        }, 1000)
      } catch (err: any) {
        console.error("Error fetching vendor data:", err)
        setError(err.message || "Failed to load vendor data")
        setIsLoading(false)
      }
    }

    fetchVendorData()
  }, [router])

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
                <div className="text-2xl font-bold">{formatCurrency(12600)}</div>
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
                <div className="text-2xl font-bold">167</div>
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
                <div className="text-2xl font-bold">3.2%</div>
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
                <div className="text-2xl font-bold">{formatCurrency(75.45)}</div>
                <div className="flex items-center text-sm font-medium text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  4%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Compared to previous period</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6 w-full">
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="visitors">Visitors</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance</CardTitle>
                <CardDescription>Track your sales and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                          return [value, "Sales"]
                        }}
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
                    {[
                      { name: "Product A", sales: 42, revenue: 4200 },
                      { name: "Product B", sales: 38, revenue: 3800 },
                      { name: "Product C", sales: 27, revenue: 2700 },
                      { name: "Product D", sales: 21, revenue: 2100 },
                      { name: "Product E", sales: 18, revenue: 1800 },
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{product.name}</span>
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
                  <CardTitle>Sales by Channel</CardTitle>
                  <CardDescription>Where your sales are coming from</CardDescription>
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
                          {productPerformanceData.map((entry, index) => (
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
          </TabsContent>

          <TabsContent value="visitors" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Traffic</CardTitle>
                <CardDescription>Track your website visitors over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="visitors" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where your visitors are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { source: "Direct", visitors: 420, percentage: 35 },
                      { source: "Social Media", visitors: 360, percentage: 30 },
                      { source: "Search", visitors: 240, percentage: 20 },
                      { source: "Referral", visitors: 120, percentage: 10 },
                      { source: "Email", visitors: 60, percentage: 5 },
                    ].map((source, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{source.visitors} visitors</span>
                          <span className="font-medium">{source.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visitor Engagement</CardTitle>
                  <CardDescription>How visitors interact with your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Avg. Time on Site</span>
                        <span className="text-sm font-bold">3m 42s</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "65%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pages per Visit</span>
                        <span className="text-sm font-bold">2.8</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "45%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Bounce Rate</span>
                        <span className="text-sm font-bold">38%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "38%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">New vs Returning</span>
                        <span className="text-sm font-bold">72% / 28%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "72%" }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
                <CardDescription>How your products are performing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productPerformanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {productPerformanceData.map((entry, index) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Conversion Rates</CardTitle>
                  <CardDescription>View to purchase conversion by product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Product A", views: 1250, sales: 42, rate: 3.4 },
                      { name: "Product B", views: 980, sales: 38, rate: 3.9 },
                      { name: "Product C", views: 1540, sales: 27, rate: 1.8 },
                      { name: "Product D", views: 760, sales: 21, rate: 2.8 },
                      { name: "Product E", views: 690, sales: 18, rate: 2.6 },
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{product.views} views</span>
                          <span className="font-medium">{product.rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inventory Status</CardTitle>
                  <CardDescription>Current stock levels for your products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Product A", stock: 124, status: "In Stock" },
                      { name: "Product B", stock: 56, status: "In Stock" },
                      { name: "Product C", stock: 12, status: "Low Stock" },
                      { name: "Product D", stock: 0, status: "Out of Stock" },
                      { name: "Product E", stock: 78, status: "In Stock" },
                    ].map((product, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              product.status === "In Stock"
                                ? "bg-green-500"
                                : product.status === "Low Stock"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                          <span className="font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{product.stock} units</span>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              product.status === "In Stock"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : product.status === "Low Stock"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Distribution</CardTitle>
                <CardDescription>Where your customers are located</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={geographicData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="country" type="category" />
                      <Tooltip formatter={(value) => [`${value}%`, "Sales Percentage"]} />
                      <Legend />
                      <Bar dataKey="sales" name="Sales %" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Cities</CardTitle>
                  <CardDescription>Cities with the most customers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { city: "New York", country: "USA", percentage: 12 },
                      { city: "London", country: "UK", percentage: 9 },
                      { city: "Los Angeles", country: "USA", percentage: 7 },
                      { city: "Toronto", country: "Canada", percentage: 6 },
                      { city: "Sydney", country: "Australia", percentage: 5 },
                    ].map((city, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{city.city}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{city.country}</span>
                          <span className="font-medium">{city.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Language Preferences</CardTitle>
                  <CardDescription>Customer language settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "English", value: 65 },
                            { name: "Spanish", value: 15 },
                            { name: "French", value: 10 },
                            { name: "German", value: 5 },
                            { name: "Others", value: 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {productPerformanceData.map((entry, index) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}
