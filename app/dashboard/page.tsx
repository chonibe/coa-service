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
  orderId: string
  orderNumber: number
  processedAt: string
  totalPrice: number
  lineItems: LineItem[]
}

interface LineItem {
  id: string
  productId: string
  name: string
  description: string
  price: number
  quantity: number
  certificateUrl?: string
  nfcTags: NfcTag[]
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
        setDashboardData(result.dashboard)
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
        order.lineItems.some(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
        }
        return b.totalPrice - a.totalPrice
      })
  }, [dashboardData, searchQuery, sortBy])

  // Order Details Modal
  const renderOrderDetailsModal = () => {
    const selectedOrder = dashboardData.find(order => order.orderId === selectedOrderId)
    
    if (!selectedOrder) return null

    return (
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder.orderNumber} Details</DialogTitle>
            <DialogDescription>
              Processed on {formatDate(selectedOrder.processedAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder.lineItems.map(lineItem => (
            <div key={lineItem.id} className="border rounded p-3 mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{lineItem.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(lineItem.price)} × {lineItem.quantity}
                  </p>
                </div>
                {lineItem.certificateUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.open(lineItem.certificateUrl, '_blank')}
                  >
                    View Certificate
                  </Button>
                )}
              </div>
              
              {lineItem.nfcTags.length > 0 && (
                <div className="mt-2">
                  <Separator className="my-2" />
                  <h4 className="text-sm font-medium mb-2">NFC Tags</h4>
                  <div className="flex gap-2">
                    {lineItem.nfcTags.map(tag => (
                      <Badge 
                        key={tag.id} 
                        variant="outline" 
                        className={`
                          ${tag.status === 'claimed' ? 'bg-green-500' : 
                            tag.status === 'unclaimed' ? 'bg-yellow-500' : 
                            'bg-red-500'} 
                          text-white
                        `}
                      >
                        {tag.status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          <div className="text-right font-bold mt-4">
            Total: {formatCurrency(selectedOrder.totalPrice)}
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

  return (
    <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
        
        {/* Search and Filter Section */}
        <div className="flex mb-4 space-x-2">
          <div className="relative flex-grow">
            <Input 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          </div>
          
          <Select value={sortBy} onValueChange={(value: 'date' | 'total') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="total">Total Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Orders List */}
        {processedOrders.length > 0 ? (
          processedOrders.map(order => (
            <Card 
              key={order.orderId} 
              className="mb-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedOrderId(order.orderId)}
            >
              <CardHeader>
                <CardTitle>
                  Order #{order.orderNumber} 
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDate(order.processedAt)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {order.lineItems.slice(0, 2).map(lineItem => (
                    <div key={lineItem.id} className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{lineItem.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(lineItem.price)} × {lineItem.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.lineItems.length > 2 && (
                    <p className="text-sm text-muted-foreground">
                      +{order.lineItems.length - 2} more items
                    </p>
                  )}
                </div>
                <div className="mt-4 text-right font-bold">
                  Total: {formatCurrency(order.totalPrice)}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          renderEmptyState()
        )}

        {/* Order Details Modal */}
        {renderOrderDetailsModal()}
      </div>
    </PullToRefresh>
  )
} 