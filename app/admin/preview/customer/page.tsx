"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface LineItem {
  line_item_id: string
  order_id: string
  title: string
  quantity: number
  price: number
  image_url: string | null
  nfc_tag_id: string | null
  nfc_claimed_at: string | null
  certificate_url: string | null
  status: string
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

export default function CustomerPreviewPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders")
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch orders")
      }

      setOrders(data.orders)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.line_items.some(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Order Preview</h1>
        <div className="w-64">
          <Input
            placeholder="Search orders by name, ID, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{order.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline">
                  {order.line_items.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {order.line_items.map((item) => (
                  <div
                    key={item.line_item_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.nfc_tag_id ? (
                        <Badge variant="default">
                          NFC Tag: {item.nfc_tag_id}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No NFC Tag</Badge>
                      )}
                      {item.certificate_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => item.certificate_url && window.open(item.certificate_url, "_blank")}
                        >
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 