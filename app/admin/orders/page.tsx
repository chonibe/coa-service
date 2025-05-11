"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, RefreshCw, ExternalLink, Package } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Order {
  id: string
  order_id: string
  order_name: string
  line_item_id: string
  product_id: string
  variant_id: string
  edition_number: number | null
  edition_total: number | null
  created_at: string
  updated_at: string
  status: string
  removed_reason: string | null
  product?: {
    title: string
    vendor: string
    certificate_url: string
  }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncingProducts, setIsSyncingProducts] = useState(false)

  const fetchOrders = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/shopify/orders?page=${pageNum}&status=${statusFilter}&search=${searchTerm}`
      )

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to fetch orders`)
      }

      const data = await response.json()
      
      if (refresh) {
        setOrders(data.orders)
      } else {
        setOrders(prev => [...prev, ...data.orders])
      }
      
      setHasMore(data.hasMore)
      setPage(pageNum)
    } catch (err: any) {
      console.error("Error fetching orders:", err)
      setError(err.message || "Failed to fetch orders")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders(1, true)
  }, [statusFilter, searchTerm])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchOrders(1, true)
  }

  const handleLoadMore = () => {
    fetchOrders(page + 1)
  }

  const handleSyncProducts = async () => {
    try {
      setIsSyncingProducts(true)
      setError(null)

      const response = await fetch("/api/shopify/sync-products", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to sync products`)
      }

      const data = await response.json()
      
      // Refresh orders to show updated product details
      await fetchOrders(1, true)
    } catch (err: any) {
      console.error("Error syncing products:", err)
      setError(err.message || "Failed to sync products")
    } finally {
      setIsSyncingProducts(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "removed":
        return <Badge variant="destructive">Removed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading && !isRefreshing) {
    return (
      <div className="container mx-auto py-10 max-w-7xl">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shopify Orders</h1>
            <p className="text-muted-foreground mt-2">View and manage Shopify orders</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSyncProducts} disabled={isSyncingProducts}>
              {isSyncingProducts ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Sync Products
            </Button>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View all Shopify orders and their details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="removed">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Edition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={`${order.order_id}-${order.line_item_id}`}>
                      <TableCell>
                        <div className="font-medium">{order.order_name}</div>
                        <div className="text-sm text-muted-foreground">#{order.order_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.product?.title || "Unknown Product"}</div>
                        <div className="text-sm text-muted-foreground">ID: {order.product_id}</div>
                      </TableCell>
                      <TableCell>{order.product?.vendor || "Unknown"}</TableCell>
                      <TableCell>
                        {order.edition_number ? (
                          <div>
                            {order.edition_number}
                            {order.edition_total && ` / ${order.edition_total}`}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{new Date(order.updated_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {order.product?.certificate_url && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={order.product.certificate_url} target="_blank">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Certificate
                              </Link>
                            </Button>
                          )}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/product-editions/${order.product_id}`}>
                              View Editions
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 