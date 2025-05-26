'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, ShoppingBag, User, BadgeIcon as Certificate, Tag } from "lucide-react"
import { toast } from "sonner"

interface LineItem {
  id: string
  order_id: string
  name: string
  description: string | null
  price: number
  quantity: number
  vendor_name: string | null
  status: string
  created_at: string
  img_url: string | null
  edition_number: number | null
  edition_total: number | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

export default function DashboardPreviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLineItem, setSelectedLineItem] = useState<{
    line_item_id: string
    title: string
    image_url: string | null
    vendor: string | null
    edition_number: number | null
    edition_total: number | null
    nfc_tag_id: string | null
  } | null>(null)
  const searchParams = useSearchParams()
  const customerId = searchParams.get('customer_id')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/customer/orders', {
          headers: {
            'x-preview-mode': 'true',
            'x-customer-id': customerId || ''
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }

        const data = await response.json()
        setOrders(data.orders)
      } catch (err) {
        console.error('Error fetching orders:', err)
        setError(err instanceof Error ? err.message : 'Failed to load orders')
        toast.error('Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

  const filteredOrders = orders.filter(order => {
    if (!order || !order.line_items) return false
    
    return order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.line_items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No orders found</AlertTitle>
        <AlertDescription>
          You haven't placed any orders yet
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Customer Preview</h1>
          <p className="text-zinc-400">View and manage customer orders</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-96 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Order #{order.name}</CardTitle>
                    <p className="text-sm text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={order.line_items[0]?.status === 'completed' ? 'default' : 'secondary'}>
                    {order.line_items[0]?.status?.charAt(0).toUpperCase() + order.line_items[0]?.status?.slice(1) || 'Unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.line_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {item.img_url ? (
                          <img
                            src={item.img_url}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-zinc-600" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-zinc-400">
                            {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                          {item.vendor_name && (
                            <p className="text-sm text-zinc-500">{item.vendor_name}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLineItem({
                          line_item_id: item.id,
                          title: item.name,
                          image_url: item.img_url,
                          vendor: item.vendor_name,
                          edition_number: item.edition_number,
                          edition_total: item.edition_total,
                          nfc_tag_id: item.nfc_tag_id
                        })}
                      >
                        <Certificate className="w-4 h-4 mr-2" />
                        View Certificate
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Certificate Modal */}
      <Dialog open={!!selectedLineItem} onOpenChange={() => setSelectedLineItem(null)}>
        <DialogContent className="max-w-2xl">
          {selectedLineItem && (
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedLineItem.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedLineItem.image_url && (
                  <div className="relative aspect-square">
                    <img
                      src={selectedLineItem.image_url}
                      alt={selectedLineItem.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Certificate Details</h3>
                    {selectedLineItem.edition_number && selectedLineItem.edition_total && (
                      <p className="text-sm text-zinc-400">
                        Edition {selectedLineItem.edition_number} of {selectedLineItem.edition_total}
                      </p>
                    )}
                    {selectedLineItem.vendor && (
                      <p className="text-sm text-zinc-400">Artist: {selectedLineItem.vendor}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">NFC Status</h3>
                    <Badge variant={selectedLineItem.nfc_tag_id ? 'default' : 'destructive'}>
                      {selectedLineItem.nfc_tag_id ? 'NFC Tag Assigned' : 'No NFC Tag'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 