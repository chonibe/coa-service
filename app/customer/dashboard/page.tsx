"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, AlertCircle, Wifi, WifiOff, Scan, Hash, User, Album } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NfcTagScanner } from '@/src/components/NfcTagScanner'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CertificateModal } from './certificate-modal'

interface LineItem {
  id: string
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
  edition_total?: number | null
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
        ? `/api/customer/dashboard/${customerId}` 
        : '/api/customer/dashboard'

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

  const handleNfcScan = async () => {
    try {
      if (!('NDEFReader' in window)) {
        throw new Error('NFC is not supported on this device')
      }

      const ndef = new (window as any).NDEFReader()
      await ndef.scan()

      ndef.onreading = ({ message }: any) => {
        // Handle NFC reading
        console.log('NFC Message:', message)
      }

      ndef.onreadingerror = () => {
        throw new Error('Error reading NFC tag')
      }
    } catch (error) {
      console.error('NFC Error:', error)
      setError('Failed to scan NFC tag')
    }
  }

  const getNfcStatus = (lineItem: LineItem) => {
    // Debug logging
    console.log('Get NFC Status Debug:', {
      lineItemId: lineItem.line_item_id,
      nfcTagId: lineItem.nfc_tag_id,
      nfcClaimedAt: lineItem.nfc_claimed_at
    })

    if (lineItem.nfc_tag_id && lineItem.nfc_claimed_at) {
      return { status: "paired", label: "Paired", variant: "default" as const }
    }
    if (lineItem.nfc_tag_id) {
      return { status: "unclaimed", label: "Unclaimed", variant: "secondary" as const }
    }
    return { status: "unpaired", label: "Unpaired", variant: "destructive" as const }
  }

  const handleCertificateClick = (lineItem: LineItem) => {
    // Debug logging
    console.log('Certificate Click Debug:', {
      lineItem,
      nfcStatus: getNfcStatus(lineItem)
    })
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
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "NFC Tag Verified",
          description: `Artwork authenticated: ${result.artworkTitle}`,
        })
      } else {
        toast({
          title: "NFC Tag Verification Failed",
          description: result.message || "Unable to verify the NFC tag",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("NFC Tag Verification Error:", error)
      toast({
        title: "Verification Error",
        description: "An error occurred while verifying the NFC tag",
        variant: "destructive",
      })
    }
  }

  const handleNfcPairing = async (lineItem?: LineItem) => {
  if (lineItem) {
    setSelectedLineItem(lineItem)
  }
    try {
      if (!('NDEFReader' in window)) {
        throw new Error('NFC is not supported on this device')
      }

      // If a line item is passed, set it as the selected line item
      if (lineItem) {
        setSelectedLineItem(lineItem)
      }

      const ndef = new (window as any).NDEFReader()
      await ndef.scan()

      ndef.onreading = ({ message }: any) => {
        // Handle NFC reading
        console.log('NFC Message:', message)
      }

      ndef.onreadingerror = () => {
        throw new Error('Error reading NFC tag')
      }
    } catch (error) {
      console.error('NFC Error:', error)
      setError('Failed to scan NFC tag')
    }
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
                        const nfcStatus = getNfcStatus(item)
                        return (
                          <div 
                            key={item.line_item_id} 
                            className="relative group cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              onClick={() => handleCertificateClick(item)}
                            />
                            <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                              <div className="flex-shrink-0">
                                {item.img_url ? (
                                  <img 
                                    src={item.img_url} 
                                    alt={item.name} 
                                    className="w-20 h-20 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                                    <Album className="w-10 h-10 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow space-y-1">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold text-sm sm:text-base">{item.name}</h3>
                                  <Badge 
                                    variant={nfcStatus.variant} 
                                    className="hidden sm:inline-flex"
                                  >
                                    {nfcStatus.label}
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {item.vendor_name || 'Unknown Vendor'} • Edition {item.edition_number || 'N/A'}/{item.edition_total || 'N/A'}
                                </p>
                                <Badge 
                                  variant={nfcStatus.variant} 
                                  className="sm:hidden mt-2"
                                >
                                  {nfcStatus.label}
                                </Badge>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-1/2 mr-2"
                                onClick={() => handleCertificateClick(item)}
                              >
                                View Certificate
                              </Button>
                              {!item.nfc_claimed_at && item.nfc_tag_id && (
                                <Button 
                                  size="sm" 
                                  className="w-1/2"
                                  onClick={() => {
                                    setSelectedLineItem(item)
                                    handleNfcPairing(item)
                                  }}
                                >
                                  Authenticate NFC
                                </Button>
                              )}
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