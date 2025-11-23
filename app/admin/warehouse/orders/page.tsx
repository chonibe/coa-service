'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WarehouseOrderCard } from './components/WarehouseOrderCard'
import { PackageTracker } from './components/PackageTracker'
import { TrackingTimeline } from './components/TrackingTimeline'
import { AlertCircle, Calendar, Search, RefreshCw } from 'lucide-react'
import type { ChinaDivisionOrderInfo, OrderTrackListItem } from '@/lib/chinadivision/client'

export default function WarehouseOrdersPage() {
  const [orders, setOrders] = useState<ChinaDivisionOrderInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<ChinaDivisionOrderInfo | null>(null)
  const [trackingData, setTrackingData] = useState<OrderTrackListItem | null>(null)
  const [isLoadingTracking, setIsLoadingTracking] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  
  // Date range filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30) // Default to last 30 days
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
      })

      const response = await fetch(`/api/warehouse/orders?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
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

  useEffect(() => {
    fetchOrders()
  }, [startDate, endDate])

  const handleViewDetails = async (orderId: string) => {
    try {
      // Fetch order details
      const response = await fetch(`/api/warehouse/orders/${orderId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch order details')
      }

      setSelectedOrder(data.order)
      setIsDetailsOpen(true)
      setTrackingData(null)

      // Fetch tracking timeline using customer order ID
      if (data.order?.order_id) {
        setIsLoadingTracking(true)
        try {
          const trackResponse = await fetch(
            `/api/warehouse/orders/track-list?order_ids=${encodeURIComponent(data.order.order_id)}`
          )
          const trackData = await trackResponse.json()

          if (trackResponse.ok && trackData.tracking && trackData.tracking.length > 0) {
            setTrackingData(trackData.tracking[0])
          }
        } catch (trackErr) {
          console.error('Error fetching tracking data:', trackErr)
          // Don't show error for tracking - it's optional
        } finally {
          setIsLoadingTracking(false)
        }
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err)
      setError(err.message || 'Failed to load order details')
    }
  }

  // Filter orders by search query
  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      order.order_id.toLowerCase().includes(query) ||
      order.ship_email?.toLowerCase().includes(query) ||
      order.first_name?.toLowerCase().includes(query) ||
      order.last_name?.toLowerCase().includes(query) ||
      order.tracking_number?.toLowerCase().includes(query) ||
      order.last_mile_tracking?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Warehouse Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Track orders from ChinaDivision warehouse
          </p>
        </div>
        <Button onClick={fetchOrders} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter orders by date range and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by order ID, email, name, or tracking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
            <p className="text-muted-foreground">
              {searchQuery ? 'No orders found matching your search.' : 'No orders found for the selected date range.'}
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
            {filteredOrders.map((order) => (
              <WarehouseOrderCard
                key={order.order_id}
                order={order}
                onViewDetails={handleViewDetails}
              />
            ))}
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
              <WarehouseOrderCard order={selectedOrder} />
              {trackingData && (
                <TrackingTimeline trackingData={trackingData} />
              )}
              {isLoadingTracking && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Loading tracking information...
                  </CardContent>
                </Card>
              )}
              {selectedOrder.info && selectedOrder.info.length > 0 && (
                <PackageTracker
                  packages={selectedOrder.info}
                  orderId={selectedOrder.order_id}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

