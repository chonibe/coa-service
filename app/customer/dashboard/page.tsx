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
    // Check if customer is logged in on the Shopify storefront
    const checkCustomerAuthentication = async () => {
      try {
        // Fetch customer information from Shopify
        const response = await fetch('/account', {
          credentials: 'include', // Important for sending cookies
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          // Not logged in, redirect to login
          window.location.href = `/api/auth/shopify`
          return false
        }

        const customerData = await response.json()
        
        if (!customerData.customer) {
          // No customer found, redirect to login
          window.location.href = `/api/auth/shopify`
          return false
        }

        // Customer is logged in, proceed with fetching orders
        return true
      } catch (error) {
        console.error('Authentication check failed:', error)
        window.location.href = `/api/auth/shopify`
        return false
      }
    }

    const fetchOrders = async () => {
      try {
        // First, verify authentication
        const isAuthenticated = await checkCustomerAuthentication()
        if (!isAuthenticated) return

        setIsLoading(true)
        setError(null)

        // Fetch orders using Shopify customer ID from Shopify's account page
        const response = await fetch('/account/orders', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }

        const ordersData = await response.json()

        // Transform Shopify orders to match your application's order structure
        const formattedOrders = ordersData.orders.map((order: any) => ({
          id: order.id.toString(),
          name: order.name,
          created_at: order.created_at,
          line_items: order.line_items.map((item: any) => ({
            line_item_id: item.id.toString(),
            title: item.title,
            quantity: item.quantity,
            // Add more fields as needed
          }))
        }))

        setOrders(formattedOrders)
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
                // Redirect to Shopify OAuth
                window.location.href = `/api/auth/shopify`
              }} 
              className="mt-4 w-full"
            >
              Authenticate with Shopify
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