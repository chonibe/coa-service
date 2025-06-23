import { ArtworkCard } from "@/components/ui/artwork-card"
"use client"

import { useEffect, useState, useRef } from "react"
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

function FloatingCard({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * 5
    const rotateY = ((x - centerX) / centerX) * -5
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
  }
  
  const handleMouseLeave = () => {
    const card = cardRef.current
    if (!card) return
    card.style.transform = ""
  }
  
  return (
    <div
      ref={cardRef}
      className={`relative bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:border-zinc-700/50 overflow-hidden ${className}`}
      style={{ willChange: "transform" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
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
                  <div
                    key={order.id}
                    className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold">Order #{order.order_number}</h2>
                          <p className="text-sm text-zinc-400">
                            {new Date(order.processed_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            order.fulfillment_status === 'fulfilled' ? 'bg-green-500/20 text-green-400' :
                            order.fulfillment_status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {order.fulfillment_status?.charAt(0).toUpperCase() + order.fulfillment_status?.slice(1) || 'Processing'}
                          </span>
                          <span className="text-lg font-semibold">
                            ${order.total_price?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {order.line_items.map((item) => (
                          <FloatingCard
                            key={item.line_item_id}
                            className="group relative flex items-start gap-4 p-4 cursor-pointer"
                            onClick={() => handleCertificateClick(item)}
                          >
                            {item.img_url && (
                              <div className="relative w-24 h-24 flex-shrink-0">
                                <img
                                  src={item.img_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate">{item.name}</h3>
                              {item.vendor_name && (
                                <p className="text-sm text-zinc-400 mt-1">{item.vendor_name}</p>
                              )}
                              {item.edition_number && item.edition_total && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Hash className="h-4 w-4 text-indigo-400" />
                                  <span className="text-sm text-indigo-400">
                                    Edition #{item.edition_number} of {item.edition_total}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {item.nfc_tag_id && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleNfcPairing(item)}
                                  >
                                    <Wifi className="h-4 w-4 mr-2" /> 
                                    {getNfcStatus(item).label}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </FloatingCard>
                        ))}
                      </div>
                    </div>
                  </div>
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