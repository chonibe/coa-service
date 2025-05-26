'use client'

import { useEffect, useState } from 'react'
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

export default function PreviewPage() {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSpecificOrder()
  }, [])

  const fetchSpecificOrder = async () => {
    try {
      const response = await fetch('/api/supabase-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'fetchOrderLineItems',
          params: { 
            order_id: '11741876552066'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      if (!data.success || !data.data || data.data.length === 0) {
        setOrder(null)
      } else {
        // Transform the data to match our expected format
        const transformedOrders = transformSupabaseDataToOrders(data.data)
        setOrder(transformedOrders[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order')
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
          <p className="mt-4 text-muted-foreground">Loading preview...</p>
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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Order Preview</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Order #{order.name}</CardTitle>
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
            <div className="space-y-6">
              {order.line_items.map(item => (
                <div key={item.id} className="flex items-start space-x-6 p-6 border rounded-lg bg-white shadow-sm">
                  <div className="w-32 h-32 flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.vendor} • Edition {item.edition_number} of {item.edition_total}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatMoney(item.total)}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-4">
                      {item.certificate_url && (
                        <Button
                          variant="outline"
                          onClick={() => window.open(item.certificate_url, '_blank')}
                        >
                          View Certificate
                        </Button>
                      )}
                      {item.nfc_tag_id && !item.nfc_claimed_at && (
                        <Button variant="secondary">
                          Claim NFC Tag
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
} 