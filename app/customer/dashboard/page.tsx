"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, AlertCircle, Wifi, WifiOff, Scan, Hash, User } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NfcTagScanner } from '@/src/components/NfcTagScanner'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CertificateModal } from './certificate-modal'

interface LineItem {
  line_item_id: string
  name: string
  description?: string
  quantity: number
  price?: number
  img_url?: string
  nfc_tag_id: string | null
  certificate_url: string
  certificate_token?: string
  nfc_claimed_at?: string | null
  order_id?: string
  edition_number?: number | null
  vendor_name?: string
  status?: string
}

interface Order {
  id: string
  order_number: number
  processed_at: string
  total_price: number
  financial_status: string
  fulfillment_status: string | null
  line_items: LineItem[]
}

export default function CustomerDashboard() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null)

  useEffect(() => {
    // Check for Shopify customer ID cookie
    const shopifyCustomerId = document.cookie
      .split('; ')
      .find(row => row.startsWith('shopify_customer_id='))
      ?.split('=')[1]

    // Check for Shopify customer login flag
    const isShopifyCustomerLogin = document.cookie
      .split('; ')
      .some(row => row.startsWith('shopify_customer_login=true'))

    // Debug logging
    console.log('Customer Dashboard Debug:', {
      allCookies: document.cookie,
      shopifyCustomerId,
      isShopifyCustomerLogin,
      currentUrl: window.location.href
    })

    // If no customer ID, redirect to Shopify login
    if (!shopifyCustomerId) {
      console.log('No customer ID found, redirecting to Shopify auth')
      // Redirect to Shopify login
      window.location.href = `/api/auth/shopify`
      return
    }

    console.log('Customer ID found:', shopifyCustomerId)

    // If just logged in via Shopify, clear the login flag
    if (isShopifyCustomerLogin) {
      // Remove the Shopify customer login flag
      document.cookie = 'shopify_customer_login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    }

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Extract customer ID from URL
      const customerId = window.location.pathname.split('/').pop()

      // Use the customer API endpoint with optional customer ID
      const url = customerId 
        ? `/api/customer/orders?customerId=${customerId}` 
        : '/api/customer/orders'

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to fetch orders')
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch orders')
      }

      setOrders(data.orders || [])
    } catch (err: any) {
        console.error('Dashboard Fetch Error:', err)
        setError(err.message || 'An unexpected error occurred')
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

  const handleCertificateClick = (lineItem: LineItem) => {
    setSelectedLineItem(lineItem)
  }

  const handleNfcTagScanned = async (tagId: string) => {
    try {
      // Verify the NFC tag with the backend
      const response = await fetch('/api/nfc-tags/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tagId }),
      });

      const result = await response.json();

      if (result.success) {
        // Tag is valid, update UI or perform additional actions
        toast({
          title: "NFC Tag Verified",
          description: `Artwork authenticated: ${result.artworkTitle}`,
        });

        // Optionally refresh orders or trigger a re-fetch
        // fetchOrders();
      } else {
        toast({
          title: "NFC Tag Verification Failed",
          description: result.message || "Unable to verify the NFC tag",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("NFC Tag Verification Error:", error);
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the NFC tag",
        variant: "destructive",
      });
    }
  };

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
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main dashboard content */}
          <div className="md:col-span-2">
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
                      <CardTitle>Order #{order.order_number}</CardTitle>
                      <CardDescription>
                        {new Date(order.processed_at).toLocaleDateString()} • {order.financial_status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {order.line_items.map((item) => {
                        // Determine NFC status with more detailed logic
                        const nfcStatus = item.nfc_tag_id 
                          ? (item.nfc_claimed_at 
                            ? { 
                                status: "paired", 
                                label: "Authenticated", 
                                icon: <Wifi className="w-4 h-4 text-green-500" />,
                                variant: "default" as const
                              }
                            : { 
                                status: "unpaired", 
                                label: "Needs Authentication", 
                                icon: <WifiOff className="w-4 h-4 text-yellow-500" />,
                                variant: "secondary" as const
                              })
                          : {
                              status: "no-nfc",
                              label: "No NFC",
                              icon: <WifiOff className="w-4 h-4 text-red-500" />,
                              variant: "destructive" as const
                            }

                        return (
                          <div key={item.line_item_id} className="flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {item.img_url ? (
                                  <img 
                                    src={item.img_url} 
                                    alt={item.name} 
                                    className="w-16 h-16 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-zinc-200 rounded-md flex items-center justify-center">
                                    <Hash className="w-8 h-8 text-zinc-500" />
                                  </div>
                                )}
                                <div>
                                  <h3 className="text-sm font-semibold">{item.name}</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {item.vendor_name || "Street Collector"}
                                  </p>
                                </div>
                              </div>
                              <Badge 
                                variant={nfcStatus.variant}
                                className="flex items-center gap-2"
                              >
                                {nfcStatus.icon}
                                {nfcStatus.label}
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              {item.certificate_url && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(item.certificate_url, '_blank')}
                                >
                                  <Link className="w-4 h-4 mr-2" />
                                  View Certificate
                                </Button>
                              )}
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleCertificateClick(item)}
                              >
                                <Scan className="w-4 h-4 mr-2" />
                                Authenticate
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* NFC Scanner Sidebar */}
          <div className="md:col-span-1">
            <NfcTagScanner onTagScanned={handleNfcTagScanned} />
          </div>
        </div>
      </div>
      
      {/* Certificate Modal */}
      <CertificateModal 
        lineItem={selectedLineItem} 
        onClose={() => setSelectedLineItem(null)} 
      />
      
      <Toaster />
    </>
  )
} 