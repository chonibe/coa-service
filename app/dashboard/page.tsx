'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Order {
  id: string
  name: string
  created_at: string
  financial_status: string
  line_items: LineItem[]
}

interface LineItem {
  id: string
  line_item_id: string
  product_id: string
  title: string
  quantity: number
  price: string
  total: string
  vendor: string
  image: string
  status: string
  nfc_tag_id?: string
  nfc_claimed_at?: string
  certificate_url?: string
  edition_number?: number
  edition_total?: number
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    // Get customer ID from URL path
    const pathParts = window.location.pathname.split('/')
    const id = pathParts[pathParts.length - 1]
    if (id) {
      setCustomerId(id)
      fetchOrders(id)
    } else {
      setError('No customer ID found. Please authenticate first.')
      setLoading(false)
    }
  }, [])

  const fetchOrders = async (customerId: string) => {
    try {
      const response = await fetch('/api/supabase-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Customer-ID': customerId
        },
        body: JSON.stringify({
          action: 'fetchOrderLineItems',
          params: { 
            limit: 20,
            customer_id: customerId
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      if (!data.success || !data.data) {
        setOrders([])
      } else {
        // Transform the data to match our expected format
        const transformedOrders = transformSupabaseDataToOrders(data.data)
        setOrders(transformedOrders)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const transformSupabaseDataToOrders = (supabaseData: any[]): Order[] => {
    const orderMap = new Map()
    
    supabaseData.forEach(item => {
      if (!orderMap.has(item.order_id)) {
        orderMap.set(item.order_id, {
          id: item.order_id,
          name: item.order_name?.replace('#', '') || item.order_id,
          created_at: item.created_at,
          financial_status: "paid",
          line_items: []
        })
      }
      
      const order = orderMap.get(item.order_id)
      order.line_items.push({
        id: item.line_item_id,
        line_item_id: item.line_item_id,
        product_id: item.product_id,
        title: item.title || `Product ${item.product_id}`,
        quantity: item.quantity || 1,
        price: item.price || "0.00",
        total: (parseFloat(item.price || "0") * (item.quantity || 1)).toFixed(2),
        vendor: item.vendor_name || "Unknown Vendor",
        image: item.image_url || "/placeholder.svg?height=400&width=400",
        status: item.status,
        nfc_tag_id: item.nfc_tag_id,
        nfc_claimed_at: item.nfc_claimed_at,
        certificate_url: item.certificate_url,
        edition_number: item.edition_number,
        edition_total: item.edition_total
      })
    })
    
    return Array.from(orderMap.values())
  }

  const formatMoney = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Orders</h1>
      <div className="space-y-8">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          orders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Order {order.name}</CardTitle>
                    <CardDescription>
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                    {order.financial_status.charAt(0).toUpperCase() + order.financial_status.slice(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.line_items.map(item => (
                    <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.vendor} • Edition {item.edition_number} of {item.edition_total}
                        </p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="text-sm">
                            Quantity: {item.quantity}
                          </span>
                          <span className="text-sm font-medium">
                            {formatMoney(item.total)}
                          </span>
                        </div>
                        {item.certificate_url && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(item.certificate_url, '_blank')}
                            >
                              View Certificate
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  )
} 