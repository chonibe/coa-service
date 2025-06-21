"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Link, AlertCircle, Wifi, WifiOff, Scan, Hash, User, Award, Gift, Clock } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { NfcTagScanner } from '@/src/components/NfcTagScanner'
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { CertificateModal } from './certificate-modal'
import { format } from "date-fns"

interface LineItem {
  id: string
  name: string
  product_id: string
  vendor_id: string
  image_url: string
  nfc_claimed_at?: string
  description?: string
  quantity: number
  price?: number
  img_url?: string
  nfc_tag_id: string | null
  certificate_url: string
  certificate_token?: string
  order_id?: string
  edition_number?: number | null
  edition_total?: number | null
  vendor_name?: string
  status?: string
}

interface RewardTier {
  name: string
  required_points: number
  benefits: string[]
}

interface RewardEvent {
  id: string
  customer_id: string
  points: number
  reason: string
  created_at: string
}

interface RewardsData {
  points: number
  level: string
  currentTier: RewardTier
  nextTier?: RewardTier
  recentEvents: RewardEvent[]
}

export default function CustomerDashboardPage({
  params,
}: {
  params: { customerId: string }
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [rewards, setRewards] = useState<RewardsData | null>(null)
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

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/customer/dashboard/${params.customerId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Failed to fetch dashboard data')
        }

        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch dashboard data')
        }

        setLineItems(data.lineItems || [])
        setRewards(data.rewards || null)
      } catch (err: any) {
        console.error('Dashboard Fetch Error:', err)
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [router, params.customerId])

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
      lineItemId: lineItem.id,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-6xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="grid gap-8">
        {/* Collection Section */}
        <section>
          <h1 className="text-2xl font-bold mb-6">Your Digital Art Collection</h1>

          {lineItems.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Artworks Yet</CardTitle>
                <CardDescription>
                  Your digital art collection will appear here once you make a purchase.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lineItems.map((item) => {
                const nfcStatus = getNfcStatus(item)
                return (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle>{item.name}</CardTitle>
                      <CardDescription>
                        {item.vendor_name || 'Unknown Vendor'} • Edition {item.edition_number || 'N/A'}/{item.edition_total || 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={nfcStatus.variant}>
                            {nfcStatus.label}
                          </Badge>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCertificateClick(item)
                          }}
                        >
                          View Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Rewards Section */}
        {rewards && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle>Rewards & Benefits</CardTitle>
                <CardDescription>
                  Earn points and unlock exclusive benefits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Level */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <div>
                        <p className="font-medium">{rewards.level || "Bronze"} Level</p>
                        <p className="text-sm text-muted-foreground">{rewards.points || 0} points</p>
                      </div>
                    </div>
                    {rewards.nextTier && (
                      <Badge variant="outline" className="bg-zinc-900/50">
                        {rewards.nextTier.required_points - rewards.points} points to {rewards.nextTier.name}
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {rewards.nextTier && (
                    <div className="space-y-2">
                      <div className="h-2 bg-zinc-900/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all"
                          style={{ width: `${(rewards.points / rewards.nextTier.required_points) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-right">
                        {Math.round((rewards.points / rewards.nextTier.required_points) * 100)}% to next level
                      </p>
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <h3 className="font-medium">Your Benefits</h3>
                  <div className="grid gap-2">
                    {rewards.currentTier.benefits.map((benefit: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Gift className="w-4 h-4 text-amber-400" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-2">
                  <h3 className="font-medium">Recent Activity</h3>
                  {rewards.recentEvents && rewards.recentEvents.length > 0 ? (
                    <div className="space-y-2">
                      {rewards.recentEvents.map((event: RewardEvent) => (
                        <div
                          key={event.id}
                          className="flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="text-sm">{event.reason}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400">
                            +{event.points}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {selectedLineItem ? (
        <CertificateModal
          lineItem={selectedLineItem}
          onClose={() => setSelectedLineItem(null)}
        />
      ) : null}

      <Toaster />
    </div>
  )
} 