"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { TimeRangeSelector, type TimeRange, type DateRange } from "@/components/vendor/time-range-selector"
import { LoadingSkeleton } from "@/components/vendor/loading-skeleton"
import { EmptyState } from "@/components/vendor/empty-state"
import { BarChart3 } from "lucide-react"
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
  imageUrl?: string | null
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
  const [sortField, setSortField] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [timeRange, setTimeRange] = useState<TimeRange>("30d")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const { toast } = useToast()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 2,
    }).format(value)

  const fetchAnalyticsData = async (range?: TimeRange, customRange?: DateRange) => {
    try {
      setIsLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      params.set("range", range || timeRange)
      if (customRange || dateRange) {
        const rangeToUse = customRange || dateRange
        if (rangeToUse) {
          params.set("from", rangeToUse.from.toISOString())
          params.set("to", rangeToUse.to.toISOString())
        }
      }

      const response = await fetch(`/api/vendor/sales-analytics?${params.toString()}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch analytics data: ${errorData.error || response.status}`)
      }

      const data = await response.json()

      setSalesByDate(data.salesByDate || [])
      setSalesByProduct(data.salesByProduct || [])
      setSalesHistory(data.salesHistory || [])
      setTotalItems(data.totalItems || 0)
    } catch (err) {
      console.error("Error fetching analytics data:", err)
      setError(err instanceof Error ? err.message : "Failed to load analytics data")
      toast({
        variant: "destructive",
        title: "Error loading analytics",
        description: err instanceof Error ? err.message : "Failed to load analytics data",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const handleTimeRangeChange = (range: TimeRange, customRange?: DateRange) => {
    setTimeRange(range)
    if (customRange) {
      setDateRange(customRange)
    } else {
      setDateRange(undefined)
    }
    fetchAnalyticsData(range, customRange)
  }

  const handleExport = () => {
    try {
      // Create CSV content
      const headers = ["Date", "Product", "Price", "Quantity", "Revenue"]
      const rows = salesHistory.map((sale) => [
        formatDate(sale.date),
        sale.title,
        sale.price.toString(),
        (sale.quantity || 1).toString(),
        ((sale.price * (sale.quantity || 1)) / 1).toFixed(2),
      ])

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sales-analytics-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: "Sales data has been exported to CSV",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: err instanceof Error ? err.message : "Failed to export data",
      })
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground">View your sales performance over time</p>
        </div>
        <div className="flex items-center gap-3">
          <TimeRangeSelector
            value={timeRange}
            dateRange={dateRange}
            onChange={handleTimeRangeChange}
          />
              {salesHistory.length > 0 && (
                <Button 
                  onClick={handleExport} 
                  variant="outline" 
                  size="sm"
                  aria-label="Export sales data to CSV"
                  className="min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Export CSV
                </Button>
              )}
        </div>
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

      {totalItems === 0 && !isLoading && !error && (
        <EmptyState
          icon={BarChart3}
          title="No Sales Data"
          description="There is no sales data available for the selected time range. Sales data will appear here once orders are processed."
        />
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
          <CardDescription>Monthly sales and revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton variant="chart" />
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
                    if (name === "Revenue (£)") {
                      return [formatCurrency(Number(value)), "Revenue (£)"]
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
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
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
                    <Suspense fallback={<LoadingSkeleton variant="chart" />}>
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
                    </Suspense>
                  </div>
              <div className="space-y-2">
                {salesByProduct.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {product.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm truncate" title={product.title}>
                        {product.title}
                      </span>
                    </div>
                    <div className="text-sm font-medium flex-shrink-0 ml-2">
                      {product.sales} sales ({formatCurrency(product.revenue)})
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
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {sale.imageUrl ? (
                              <img
                                src={sale.imageUrl}
                                alt={sale.title}
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : null}
                            <span className="font-medium">{sale.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.price)}</TableCell>
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
