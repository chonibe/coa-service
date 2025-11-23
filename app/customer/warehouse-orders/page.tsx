'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, Package, Truck, MapPin, Calendar, Mail, Phone, RefreshCw, Search } from 'lucide-react'
import type { ChinaDivisionOrderInfo } from '@/lib/chinadivision/client'

export default function CustomerWarehouseOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<ChinaDivisionOrderInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ChinaDivisionOrderInfo | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Check for Shopify customer ID cookie
    const shopifyCustomerId = document.cookie
      .split('; ')
      .find(row => row.startsWith('shopify_customer_id='))
      ?.split('=')[1]

    if (!shopifyCustomerId) {
      // Redirect to Shopify login
      window.location.href = `/api/auth/shopify`
      return
    }

    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/customer/warehouse-orders', {
        credentials: 'include',
      })
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login
          window.location.href = `/api/auth/shopify`
          return
        }
        throw new Error(data.message || 'Failed to fetch orders')
      }

      setOrders(data.orders || [])
    } catch (err: any) {
      console.error('Error fetching orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (order: ChinaDivisionOrderInfo) => {
    setSelectedOrder(order)
    setIsDetailsOpen(true)
  }

  const getStatusBadge = (status?: number, statusName?: string) => {
    if (!status && !statusName) return null

    const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'Approving', variant: 'outline' },
      10: { label: 'Approved', variant: 'default' },
      11: { label: 'Uploaded', variant: 'default' },
      8: { label: 'Picking', variant: 'secondary' },
      9: { label: 'Packing', variant: 'secondary' },
      5: { label: 'Packaged', variant: 'default' },
      2: { label: 'Awaiting Shipping', variant: 'outline' },
      3: { label: 'Shipped', variant: 'default' },
      4: { label: 'Special Event', variant: 'secondary' },
      24: { label: 'Processing', variant: 'secondary' },
      19: { label: 'Reviewing', variant: 'outline' },
      21: { label: 'Processing', variant: 'secondary' },
      23: { label: 'Canceled', variant: 'destructive' },
    }

    const statusInfo = status !== undefined ? statusMap[status] : null
    const label = statusName || statusInfo?.label || `Status ${status}`

    return (
      <Badge variant={statusInfo?.variant || 'outline'}>
        {label}
      </Badge>
    )
  }

  const getTrackStatusBadge = (trackStatus?: number, trackStatusName?: string) => {
    if (!trackStatus && !trackStatusName) return null

    const trackStatusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      0: { label: 'To be updated', variant: 'outline' },
      101: { label: 'In Transit', variant: 'default' },
      111: { label: 'Pick Up', variant: 'secondary' },
      112: { label: 'Out For Delivery', variant: 'default' },
      121: { label: 'Delivered', variant: 'default' },
      131: { label: 'Alert', variant: 'destructive' },
      132: { label: 'Expired', variant: 'destructive' },
    }

    const trackInfo = trackStatus !== undefined ? trackStatusMap[trackStatus] : null
    const label = trackStatusName || trackInfo?.label || `Track ${trackStatus}`

    return (
      <Badge variant={trackInfo?.variant || 'outline'} className="ml-2">
        {label}
      </Badge>
    )
  }

  // Filter orders by search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      order.order_id.toLowerCase().includes(query) ||
      order.tracking_number?.toLowerCase().includes(query) ||
      order.last_mile_tracking?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="container mx-auto py-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Warehouse Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your orders from our warehouse
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by order ID or tracking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No orders found matching your search.' : 'No warehouse orders found. Your orders will appear here once they are processed.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => {
              const packageCount = order.info?.length || 0
              const totalQuantity = order.info?.reduce((sum, item) => sum + parseInt(item.quantity || '0'), 0) || 0

              return (
                <Card
                  key={order.order_id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleViewDetails(order)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Order {order.order_id}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {packageCount} {packageCount === 1 ? 'package' : 'packages'} • {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {getStatusBadge(order.status, order.status_name)}
                        {getTrackStatusBadge(order.track_status, order.track_status_name)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Shipping Address */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {order.first_name} {order.last_name}
                        </p>
                        <p className="text-muted-foreground truncate">
                          {order.ship_city}, {order.ship_state}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Info */}
                    {order.tracking_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">Tracking: {order.tracking_number}</p>
                          {order.carrier && (
                            <p className="text-muted-foreground text-xs">Carrier: {order.carrier}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {new Date(order.date_added).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Package className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_id}</DialogTitle>
            <DialogDescription>
              Complete order information and package tracking
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Order Information</CardTitle>
                      <CardDescription>
                        {selectedOrder.info?.length || 0} packages • {selectedOrder.info?.reduce((sum, item) => sum + parseInt(item.quantity || '0'), 0) || 0} items
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(selectedOrder.status, selectedOrder.status_name)}
                      {getTrackStatusBadge(selectedOrder.track_status, selectedOrder.track_status_name)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Shipping Address */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1 pl-6">
                      <p className="font-medium text-foreground">
                        {selectedOrder.first_name} {selectedOrder.last_name}
                      </p>
                      <p>{selectedOrder.ship_address1}</p>
                      {selectedOrder.ship_address2 && <p>{selectedOrder.ship_address2}</p>}
                      <p>
                        {selectedOrder.ship_city}, {selectedOrder.ship_state} {selectedOrder.ship_zip}
                      </p>
                      <p>{selectedOrder.ship_country}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {selectedOrder.ship_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedOrder.ship_email}</span>
                      </div>
                    )}
                    {selectedOrder.ship_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">{selectedOrder.ship_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Tracking Info */}
                  {(selectedOrder.tracking_number || selectedOrder.last_mile_tracking) && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Tracking Information
                      </h4>
                      <div className="text-sm space-y-1 pl-6">
                        {selectedOrder.tracking_number && (
                          <p>
                            <span className="font-medium">Tracking Number:</span>{' '}
                            <span className="font-mono">{selectedOrder.tracking_number}</span>
                          </p>
                        )}
                        {selectedOrder.last_mile_tracking && (
                          <p>
                            <span className="font-medium">Last Mile Tracking:</span>{' '}
                            <span className="font-mono">{selectedOrder.last_mile_tracking}</span>
                          </p>
                        )}
                        {selectedOrder.carrier && (
                          <p>
                            <span className="font-medium">Carrier:</span> {selectedOrder.carrier}
                          </p>
                        )}
                        {selectedOrder.shipping_method && (
                          <p>
                            <span className="font-medium">Shipping Method:</span> {selectedOrder.shipping_method}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Order Date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Order Date: {new Date(selectedOrder.date_added).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Packages */}
              {selectedOrder.info && selectedOrder.info.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Packages ({selectedOrder.info.length})
                    </CardTitle>
                    <CardDescription>
                      Track individual packages for this order
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {selectedOrder.info.map((pkg, index) => {
                          const hasTracking = !!pkg.tracking_number

                          return (
                            <Card key={index} className="bg-muted/50">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">Package {index + 1}</span>
                                      {hasTracking && (
                                        <Badge variant="default" className="ml-2">
                                          Shipped
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                      {pkg.product_name || pkg.sku || 'Unknown Product'}
                                    </p>
                                    {pkg.sku && pkg.product_name && pkg.product_name !== pkg.sku && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        SKU: {pkg.sku} {pkg.sku_code && `(${pkg.sku_code})`}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">
                                      Qty: {pkg.quantity}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
                                  {pkg.color && (
                                    <div>
                                      <span className="font-medium">Color:</span> {pkg.color}
                                    </div>
                                  )}
                                  {pkg.size && (
                                    <div>
                                      <span className="font-medium">Size:</span> {pkg.size}
                                    </div>
                                  )}
                                  {pkg.category && (
                                    <div>
                                      <span className="font-medium">Category:</span> {pkg.category}
                                    </div>
                                  )}
                                  {pkg.supplier && (
                                    <div>
                                      <span className="font-medium">Supplier:</span> {pkg.supplier}
                                    </div>
                                  )}
                                </div>

                                {pkg.tracking_number && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Truck className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium">Tracking Number</p>
                                        <p className="text-muted-foreground font-mono">
                                          {pkg.tracking_number}
                                        </p>
                                        {pkg.shipping_method && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Method: {pkg.shipping_method}
                                          </p>
                                        )}
                                        {pkg.package_number && (
                                          <p className="text-xs text-muted-foreground">
                                            Package #: {pkg.package_number}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

