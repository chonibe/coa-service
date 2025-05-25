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
  payout_amount: number
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [salesByDate, setSalesByDate] = useState<any[]>([])
  const [salesByProduct, setSalesByProduct] = useState<any[]>([])
  const [salesHistory, setSalesHistory] = useState<SaleItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPayouts, setTotalPayouts] = useState(0)
  const [sortField, setSortField] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/vendor/sales-analytics")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Failed to fetch analytics data: ${errorData.error || response.status}`)
      }

      const data = await response.json()

      setSalesByDate(data.salesByDate || [])
      setSalesByProduct(data.salesByProduct || [])
      setSalesHistory(data.salesHistory || [])
      setTotalItems(data.totalItems || 0)
      setTotalPayouts(data.totalPayouts || 0)
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
          <CardDescription>Monthly sales, revenue, and payouts</CardDescription>
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
                    if (name === "Revenue (£)") {
                      return [`£${Number(value).toFixed(2)}`, "Revenue (£)"]
                    }
                    if (name === "Payouts (£)") {
                      return [`£${Number(value).toFixed(2)}`, "Payouts (£)"]
                    }
                    return [value, name]
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" name="Sales" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="revenue" name="Revenue (£)" fill="#82ca9d" />
                <Bar yAxisId="right" dataKey="payouts" name="Payouts (£)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No sales data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Product</CardTitle>
            <CardDescription>Top selling products with revenue and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : salesByProduct.length > 0 ? (
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
                      <br />
                      <span className="text-muted-foreground">
                        Payout: £{product.payouts.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No product sales data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Summary</CardTitle>
            <CardDescription>Total payouts and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Sales</span>
                  <span className="text-sm font-medium">{totalItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Revenue</span>
                  <span className="text-sm font-medium">
                    £{salesHistory.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Payouts</span>
                  <span className="text-sm font-medium">£{totalPayouts.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm font-medium">Net Earnings</span>
                  <span className="text-sm font-medium">
                    £{(salesHistory.reduce((sum, item) => sum + item.price, 0) - totalPayouts).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Detailed sales history with payout information</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : salesHistory.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payout</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSalesHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell>£{item.price.toFixed(2)}</TableCell>
                      <TableCell>£{item.payout_amount.toFixed(2)}</TableCell>
                      <TableCell>£{(item.price - item.payout_amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">No sales history available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
