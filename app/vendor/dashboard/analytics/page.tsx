"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82ca9d"]

interface SaleItem {
  id: string
  product_id: string
  title: string
  date: string
  price: number
  currency: string
  quantity?: number
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesByDate, setSalesByDate] = useState<any[]>([])
  const [salesByProduct, setSalesByProduct] = useState<any[]>([])
  const [salesHistory, setSalesHistory] = useState<SaleItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isMockData, setIsMockData] = useState(false)
  const [sortField, setSortField] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // First try the test endpoint to see if it works
      let response
      try {
        response = await fetch("/api/vendor/sales-analytics")
      } catch (err) {
        console.error("Error with main analytics endpoint, trying test endpoint:", err)
        response = await fetch("/api/vendor/test-analytics")
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`)
      }

      const data = await response.json()

      setSalesByDate(data.salesByDate || [])
      setSalesByProduct(data.salesByProduct || [])
      setSalesHistory(data.salesHistory || [])
      setTotalItems(data.totalItems || 0)
      setIsMockData(data.isMockData || false)

      if (data.isMockData) {
        toast({
          title: "Using demo data",
          description: "We're showing you sample data because your actual sales data isn't available yet.",
          duration: 5000,
        })
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics data")

      // Try to load mock data as a fallback
      try {
        const response = await fetch("/api/vendor/test-analytics")
        if (response.ok) {
          const mockData = await response.json()
          setSalesByDate(mockData.salesByDate || [])
          setSalesByProduct(mockData.salesByProduct || [])
          setSalesHistory(mockData.salesHistory || [])
          setTotalItems(mockData.totalItems || 0)
          setIsMockData(true)

          toast({
            title: "Using demo data",
            description: "We're showing you sample data because there was an error loading your actual data.",
            duration: 5000,
          })

          // Clear the error since we're showing mock data
          setError(null)
        }
      } catch (mockErr) {
        console.error("Error loading mock data:", mockErr)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Custom tooltip for the pie chart to show product titles
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background p-2 border rounded-md shadow-sm">
          <p className="font-medium">{data.title}</p>
          <p>Sales: {data.sales}</p>
          <p>Revenue: £{data.revenue.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  // Sort sales history
  const sortedSalesHistory = [...(salesHistory || [])].sort((a, b) => {
    if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    if (sortField === "price") {
      return sortDirection === "asc" ? a.price - b.price : b.price - a.price
    }
    if (sortField === "title") {
      return sortDirection === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }
    return 0
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6 pb-20 px-1">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
        <p className="text-muted-foreground">View your sales performance over time</p>
        {isMockData && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Demo Data</AlertTitle>
            <AlertDescription>
              You're currently viewing sample data. Real sales data will appear here once orders are processed.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={fetchAnalyticsData}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {totalItems === 0 && !isLoading && !error && !isMockData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Sales Data</AlertTitle>
          <AlertDescription>
            There is no sales data available yet. Sales data will appear here once orders are processed.
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
          <CardDescription>Monthly sales and revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesByDate.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={salesByDate}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "Revenue ($)") {
                      return [`£${Number(value).toFixed(2)}`, "Revenue (£)"]
                    }
                    return [value, name]
                  }}
                />
                <Legend
                  payload={[
                    { value: "Sales (Units)", type: "square", color: "#8884d8" },
                    { value: "Revenue (£)", type: "square", color: "#82ca9d" },
                  ]}
                />
                <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Sales (Units)" />
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="Revenue (£)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales trend</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : salesByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={salesByDate}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : salesByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={salesByDate}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`£${Number(value).toFixed(2)}`, "Revenue"]} />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-muted-foreground">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales by Product</CardTitle>
          <CardDescription>Distribution of sales across products</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesByProduct.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="sales"
                      nameKey="title"
                    >
                      {salesByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {salesByProduct.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm truncate max-w-[200px]" title={product.title}>
                        {product.title}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {product.sales} sales (£{product.revenue.toFixed(2)})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No product sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales History Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Detailed record of individual sales</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesHistory && salesHistory.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Sort by:</span>
                  <Select
                    value={sortField}
                    onValueChange={(value) => {
                      setSortField(value)
                      setSortDirection("desc")
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="title">Product</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                  >
                    {sortDirection === "asc" ? "↑ Ascending" : "↓ Descending"}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("date")}>
                        Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                        Product {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => handleSort("price")}>
                        Price {sortField === "price" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSalesHistory.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{formatDate(sale.date)}</TableCell>
                        <TableCell className="font-medium">{sale.title}</TableCell>
                        <TableCell className="text-right">£{sale.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[100px]">
              <p className="text-muted-foreground">No sales history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
