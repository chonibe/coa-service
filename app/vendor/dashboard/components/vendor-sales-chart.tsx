"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2, Package, Calendar, DollarSign, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

interface SalesData {
  date: string
  sales: number
  revenue: number
}

interface SoldProduct {
  id: string
  title: string
  price: number
  currency: string
  date: string
  order_id: string
  line_item_id: string
  edition_number?: number
}

interface VendorSalesChartProps {
  vendorName: string
}

export function VendorSalesChart({ vendorName }: VendorSalesChartProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<SoldProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalSales, setTotalSales] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")

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
        } else {
          throw new Error("Invalid data format received from the server")
        }

        // Fetch sold products list
        const productsResponse = await fetch("/api/vendor/sales")

        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch sold products: ${productsResponse.status} ${productsResponse.statusText}`)
        }

        const productsData = await productsResponse.json()

        if (productsData && Array.isArray(productsData.lineItems)) {
          setSoldProducts(productsData.lineItems)
          setFilteredProducts(productsData.lineItems)
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

  // Filter products when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(soldProducts)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = soldProducts.filter(
        (product) => product.title.toLowerCase().includes(term) || product.order_id.toLowerCase().includes(term),
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, soldProducts])

  // Format the date for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  // Format the full date for the table
  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <Card className="col-span-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products or order IDs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">{error}</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No products match your search." : "No sales history available."}
            </div>
          ) : (
            <div className="border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Edition</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.line_item_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{product.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.order_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatFullDate(product.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.edition_number ? (
                          <span className="font-medium">{product.edition_number}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
