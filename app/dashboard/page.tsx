"use client"

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { RefreshCw, Filter, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PullToRefresh } from '@/components/pull-to-refresh'

interface DashboardData {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

interface LineItem {
  id: string
  line_item_id: string
  name: string
  description: string
  quantity: number
  price: number
  img_url: string | null
  nfc_tag_id: string | null
  certificate_url: string | null
  certificate_token: string | null
  nfc_claimed_at: string | null
  order_id: string
  edition_number: number | null
  edition_total: number | null
  vendor_name: string | null
  status: string
}

interface NfcTag {
  id: string
  tagId: string
  claimedAt: string | null
  status: string
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtering and Sorting States
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Pull to Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/customer/dashboard')
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.orders)
      } else {
        setError(result.message || 'Failed to load dashboard')
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Pull to Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
  }

  // Filtered and Sorted Orders
  const processedOrders = useMemo(() => {
    return dashboardData
      .filter(order => 
        order.line_items.some(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.vendor_name && item.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime()
        }
        return b.total_price - a.total_price
      })
  }, [dashboardData, searchQuery, sortBy])

  const renderLineItem = (lineItem: LineItem) => (
    <div key={lineItem.id} className="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {lineItem.img_url && (
          <img 
            src={lineItem.img_url} 
            alt={lineItem.name}
            className="w-20 h-20 object-cover rounded"
          />
        )}
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{lineItem.name}</h3>
              {lineItem.vendor_name && (
                <p className="text-sm text-muted-foreground">by {lineItem.vendor_name}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(lineItem.price)} × {lineItem.quantity}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {lineItem.certificate_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => lineItem.certificate_url && window.open(lineItem.certificate_url, '_blank')}
                >
                  View Certificate
                </Button>
              )}
              {lineItem.edition_number && (
                <Badge variant="secondary">
                  Edition #{lineItem.edition_number}
                </Badge>
              )}
            </div>
          </div>
          
          {lineItem.nfc_tag_id && (
            <div className="mt-3">
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">NFC Status</span>
                <Badge 
                  variant={lineItem.nfc_claimed_at ? "secondary" : "outline"}
                  className={lineItem.nfc_claimed_at ? "bg-green-500 text-white" : "bg-yellow-500 text-white"}
                >
                  {lineItem.nfc_claimed_at ? 'Claimed' : 'Unclaimed'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Order Details Modal
  const renderOrderDetailsModal = () => {
    const selectedOrder = dashboardData.find(order => order.id === selectedOrderId)
    
    if (!selectedOrder) return null

    return (
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder.order_number}</DialogTitle>
            <DialogDescription>
              Processed on {formatDate(selectedOrder.processed_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {selectedOrder.line_items.map(renderLineItem)}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center pt-4">
            <span className="text-muted-foreground">Total Items: {
              selectedOrder.line_items.reduce((acc, item) => acc + item.quantity, 0)
            }</span>
            <span className="text-xl font-bold">
              Total: {formatCurrency(selectedOrder.total_price)}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Engaging Empty State
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-gray-50 rounded-lg">
      <img 
        src="/placeholder-logo.svg" 
        alt="No orders" 
        className="w-48 h-48 mb-6 opacity-50"
      />
      <h2 className="text-2xl font-bold mb-4">Your Digital Art Journey Begins</h2>
      <p className="text-muted-foreground mb-6">
        Explore unique digital collectibles and start your collection today!
      </p>
      <Button variant="default">
        Browse Collectibles
      </Button>
    </div>
  )

  // Main content rendering
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin">
            <RefreshCw className="w-8 h-8 text-primary" />
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      )
    }

    if (!dashboardData.length) {
      return renderEmptyState()
    }

    return (
      <div className="space-y-4">
        {processedOrders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">
                Order #{order.order_number}
              </CardTitle>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedOrderId(order.id)}
              >
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Processed on {formatDate(order.processed_at)}
                </p>
                <p className="font-medium">
                  {order.line_items.length} items • {formatCurrency(order.total_price)}
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {order.line_items.slice(0, 2).map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.vendor_name || 'Unknown Vendor'} • Edition {item.edition_number || 'N/A'}/{item.edition_total || 'N/A'}
                      </p>
                    </div>
                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
                {order.line_items.length > 2 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-center"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    View {order.line_items.length - 2} more items
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Search and Filter Section */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Search by product name or vendor..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: 'date' | 'total') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="total">Sort by Total</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderContent()}
        {renderOrderDetailsModal()}
      </div>
    </PullToRefresh>
  )
} 