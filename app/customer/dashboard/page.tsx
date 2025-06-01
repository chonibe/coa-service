"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface LineItem {
  line_item_id: string
  title: string
  quantity: number
  nfc_tag_id: string | null
  certificate_url: string
  order_id?: string
  price?: number
  image_url?: string
  nfc_claimed_at?: string | null
}

interface Order {
  id: string
  name: string
  created_at: string
  line_items: LineItem[]
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Explicit session check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session Error:', sessionError)
          throw new Error('Authentication session error')
        }

        if (!session) {
          console.error('No active session')
          router.push('/login')
          return
        }

        // Fetch orders with explicit user ID
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            name,
            created_at,
            line_items (
              line_item_id,
              title,
              quantity,
              nfc_tag_id,
              certificate_url
            )
          `)
          .eq('customer_id', session.user.id)

        if (ordersError) {
          console.error('Orders Fetch Error:', ordersError)
          throw new Error(ordersError.message || 'Failed to fetch orders')
        }

        setOrders(ordersData || [])
      } catch (err: any) {
        console.error('Comprehensive Error:', err)
        setError(err.message || 'An unexpected error occurred')
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [router, supabase])

  const getNfcStatus = (lineItem: LineItem) => {
    if (lineItem.nfc_tag_id && lineItem.nfc_claimed_at) {
      return { status: "paired", label: "Paired", variant: "default" as const }
    }
    if (lineItem.nfc_tag_id) {
      return { status: "unclaimed", label: "Unclaimed", variant: "secondary" as const }
    }
    return { status: "unpaired", label: "Unpaired", variant: "destructive" as const }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {error}. Please log in again.
            <Button 
              onClick={() => router.push('/login')} 
              className="ml-4"
            >
              Go to Login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Orders</h1>
        <Button onClick={() => router.push("/customer/authenticate")}>
          <Link className="h-4 w-4 mr-2" />
          Go to Authentication
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No orders found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>Order {order.name}</CardTitle>
                <CardDescription>
                  Placed on {new Date(order.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.line_items.map((item) => {
                    const nfcStatus = getNfcStatus(item)
                    return (
                      <div
                        key={item.line_item_id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div>
                            <h3 className="font-medium">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge variant={nfcStatus.variant}>{nfcStatus.label}</Badge>
                          {nfcStatus.status === "unpaired" && (
                            <Button
                              variant="outline"
                              onClick={() => router.push(`/customer/authenticate?lineItemId=${item.line_item_id}`)}
                            >
                              Pair NFC Tag
                            </Button>
                          )}
                          {nfcStatus.status === "paired" && (
                            <Button
                              variant="outline"
                              onClick={() => router.push(item.certificate_url)}
                            >
                              View Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 