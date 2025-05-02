"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils" // Assuming this exists, if not we'll create it

interface SalesData {
  date: string
  sales: number
  revenue: number
}

interface SaleItem {
  id: string
  product_title: string
  price: number
  created_at: string
  order_name: string
  line_item_id: string
}

interface VendorSalesChartProps {
  vendorName: string
}

export function VendorSalesChart({ vendorName }: VendorSalesChartProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [salesItems, setSalesItems] = useState<SaleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    const fetchSalesData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch sales data from the vendor stats API
        const response = await fetch("/api/vendor/stats/sales")

        if (!response.ok) {
          throw new Error(`Failed to fetch sales data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (data.salesByDate && Array.isArray(data.salesByDate)) {
          setSalesData(data.salesByDate)
          setTotalSales(data.totalSales || 0)
          setTotalRevenue(data.totalRevenue || 0)

          // Set the individual sales items
          if (data.salesItems && Array.isArray(data.salesItems)) {
            setSalesItems(data.salesItems)
          }
        } else {
          throw new Error("Invalid data format received from the server")
        }
      } catch (err: any) {
        console.error("Error fetching sales data:", err)
        setError(err.message || "Failed to load sales data")
      } finally {
        setIsLoading(false)
      }
    }

    if (vendorName) {
      fetchSalesData()
    }
  }, [vendorName])

  // Format the date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format the time for display
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center flex-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Sales</h3>
              <p className="text-2xl font-bold">{totalSales}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center flex-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">{error}</div>
          ) : salesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales data available. Once you make your first sale, data will appear here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ fontSize: 12 }}
                  label={{ value: "Items Sold", angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  label={{ value: "Revenue ($)", angle: 90, position: "insideRight", style: { textAnchor: "middle" } }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "Revenue") return [`$${value}`, name]
                    return [value, name]
                  }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend />
                <Bar dataKey="sales" name="Items Sold" fill="#8884d8" yAxisId="left" />
                <Bar dataKey="revenue" name="Revenue" fill="#82ca9d" yAxisId="right" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Sales History List */}
      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">{error}</div>
          ) : salesItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales history available. Once you make your first sale, data will appear here.
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left py-2 px-4 font-medium text-sm">Date</th>
                    <th className="text-left py-2 px-4 font-medium text-sm">Order</th>
                    <th className="text-left py-2 px-4 font-medium text-sm">Product</th>
                    <th className="text-right py-2 px-4 font-medium text-sm">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {salesItems.map((item) => (
                    <tr key={item.line_item_id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{formatDate(item.created_at)}</div>
                        <div className="text-xs text-muted-foreground">{formatTime(item.created_at)}</div>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.order_name}</td>
                      <td className="py-3 px-4 text-sm">{item.product_title}</td>
                      <td className="py-3 px-4 text-sm text-right font-medium">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
