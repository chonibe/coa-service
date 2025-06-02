"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Import server-side cookie handling
import { cookies } from 'next/headers'

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
    console.log('Dashboard useEffect started');

    // Check authentication status
    const checkAuthentication = async () => {
      console.log('Checking authentication');

      // Check if customer is logged in
      const isLoggedIn = document.cookie.includes('customer_logged_in=true');
      console.log('Is logged in:', isLoggedIn);

      if (!isLoggedIn) {
        console.log('Not logged in, redirecting to login');
        window.location.href = `/api/auth/shopify`;
        return false;
      }

      return true;
    }

    const fetchOrders = async () => {
      try {
        console.log('Fetching orders');
        
        // First, verify authentication
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) return;

        setIsLoading(true)
        setError(null)

        // Fetch orders using Supabase
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

        if (ordersError) {
          console.error('Orders Fetch Error:', ordersError)
          throw new Error(ordersError.message || 'Failed to fetch orders')
        }

        console.log('Orders fetched:', ordersData);
        setOrders(ordersData || [])
      } catch (err: any) {
        console.error('Dashboard Fetch Error:', err)
        setError(err.message || 'An unexpected error occurred')
        window.location.href = `/api/auth/shopify`
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [router])

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
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>Unable to load dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => {
                window.location.href = `/api/auth/shopify`
              }} 
              className="mt-4 w-full"
            >
              Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Digital Art Collection</h1>

      {orders.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Orders Found</CardTitle>
            <CardDescription>You haven't purchased any digital artworks yet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <CardTitle>{order.name}</CardTitle>
                <CardDescription>Purchased on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                {order.line_items.map((item) => (
                  <div key={item.line_item_id} className="mb-4">
                    <h3 className="font-semibold">{item.title}</h3>
                    {item.certificate_url && (
                      <Button
                        variant="outline"
                        size="sm" 
                        onClick={() => window.open(item.certificate_url, '_blank')}
                        className="mt-2"
                      >
                        View Certificate
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 