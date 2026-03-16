'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { trackPurchase, trackGoogleAdsConversion, type ProductItem } from '@/lib/google-analytics'
import { captureFunnelEvent, FunnelEvents, tagSessionForReplay } from '@/lib/posthog'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import {
  Container,
  SectionWrapper,
  Button,
  Card,
  CardHeader,
  CardContent,
} from '@/components/impact'

/**
 * Checkout Success Content (Client Component)
 * 
 * Uses useSearchParams to read the session_id from the URL.
 * Must be wrapped in Suspense in the parent Server Component.
 * 
 * Shows:
 * - Order summary
 * - Credits earned from purchase
 * - Claim CTA (if guest) or View Collection (if authenticated)
 * 
 * @see app/api/stripe/webhook/route.ts - Post-purchase bridge
 * @see lib/auth/claim-token.ts - Claim tokens
 */

const CREDITS_PER_DOLLAR = 10

/** Mock order + series progress for /shop/checkout/success?demo=1 (configure/preview the page) */
const MOCK_ORDER: OrderDetails = {
  id: 'pi_mock_demo_1234567890',
  status: 'complete',
  paymentStatus: 'paid',
  customerEmail: 'collector@example.com',
  amountTotal: 24900, // $249.00
  currency: 'usd',
  lineItems: [
    { description: 'Street Lamp — Artwork Insert: "Sunset Boulevard" by Artist Name', quantity: 1, amount: 19900, imageUrl: 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/preview_images/684cd0c8b42142fdad8e4db442befa6e.thumbnail.0000000000_800x.jpg?v=1770544655' },
    { description: 'Premium Matte Frame', quantity: 1, amount: 5000, imageUrl: undefined },
  ],
  shippingDetails: {
    name: 'Jane Collector',
    address: {
      line1: '123 Art Street',
      line2: 'Apt 4B',
      city: 'Brooklyn',
      state: 'NY',
      postal_code: '11201',
      country: 'US',
    },
  },
}

const MOCK_SERIES_PROGRESS: SeriesProgressItem[] = [
  { seriesName: '2025 Edition', seriesId: '2025-edition', totalArtworks: 12, ownedCount: 2, thumbnailUrl: null },
  { seriesName: 'Urban Legends', seriesId: 'urban-legends', totalArtworks: 8, ownedCount: 1, thumbnailUrl: null },
]

interface OrderDetails {
  id: string
  status: string
  paymentStatus: string
  customerEmail: string
  amountTotal: number
  currency: string
  lineItems: Array<{
    description: string
    quantity: number
    amount: number
    imageUrl?: string
  }>
  shippingDetails?: {
    name?: string
    address?: {
      line1?: string
      line2?: string
      city?: string
      state?: string
      postal_code?: string
      country?: string
    }
  }
}

interface SeriesProgressItem {
  seriesName: string
  seriesId: string
  totalArtworks: number
  ownedCount: number
  thumbnailUrl: string | null
}

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const paymentIntentId = searchParams.get('payment_intent')
  const orderParam = sessionId || paymentIntentId
  const isDemo = searchParams.get('demo') === '1' || searchParams.get('demo') === 'true'

  // Use shared auth context so the CTA doesn't flicker and auth state is consistent.
  const { isAuthenticated } = useShopAuthContext()

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paypalProcessing, setPaypalProcessing] = useState(false)
  const [seriesProgress, setSeriesProgress] = useState<SeriesProgressItem[]>([])

  useEffect(() => {
    if (!order || !order.id || !order.amountTotal) return
    const dedupeKey = `meta_purchase_tracked_${order.id}`
    if (typeof window !== 'undefined' && sessionStorage.getItem(dedupeKey) === '1') return

    // Extract payment_intent or session_id from order.id to match webhook event_id format
    // Webhook uses: purchase_${session.payment_intent || session.id}
    // For client-side dedup, we use the same format so Meta can deduplicate properly
    const orderId = order.id
    const canonicalEventId = `purchase_${orderId}` // Webhook format: purchase_${payment_intent || session_id}

    const items: ProductItem[] = (order.lineItems || []).map((item, index) => ({
      item_id: `${order.id}_${index + 1}`,
      item_name: item.description || `Item ${index + 1}`,
      price: item.amount / 100,
      quantity: item.quantity || 1,
      currency: order.currency?.toUpperCase() || 'USD',
    }))
    const purchaseValue = order.amountTotal / 100
    
    // Use trackPurchase with explicit event_id matching webhook format for deduplication
    // The webhook is the canonical source; client-side uses same event_id so Meta deduplicates
    trackPurchase(
      {
        transaction_id: order.id,
        value: purchaseValue,
        currency: order.currency?.toUpperCase() || 'USD',
        items,
      },
      { em: order.customerEmail || undefined },
      canonicalEventId
    )
    
    // Track Google Ads conversion with Enhanced Conversions (hashed email)
    if (process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID) {
      trackGoogleAdsConversion('purchase', {
        conversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL,
        value: purchaseValue,
        currency: order.currency?.toUpperCase() || 'USD',
        transaction_id: order.id,
        email: order.customerEmail || undefined,
      })
    }
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(dedupeKey, '1')
    }
  }, [order])

  useEffect(() => {
    async function fetchOrderDetails() {
      if (isDemo) {
        setOrder(MOCK_ORDER)
        setSeriesProgress(MOCK_SERIES_PROGRESS)
        setLoading(false)
        return
      }

      if (!orderParam) {
        setError('No session or payment ID provided')
        setLoading(false)
        return
      }

      try {
        // For PaymentIntent returns (PayPal redirect or inline), ensure order is fulfilled.
        // The complete-order endpoint is idempotent (skips if already fulfilled).
        if (paymentIntentId) {
          const pendingItems = sessionStorage.getItem('sc_checkout_items')
          const pendingAddress = sessionStorage.getItem('sc_checkout_address')

          if (pendingItems && pendingAddress) {
            try {
              await fetch('/api/checkout/complete-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentIntentId,
                  items: JSON.parse(pendingItems),
                  shippingAddress: JSON.parse(pendingAddress),
                }),
              })
            } catch {
              // Best-effort; webhook may already have fulfilled the order
            } finally {
              sessionStorage.removeItem('sc_checkout_items')
              sessionStorage.removeItem('sc_checkout_address')
            }
          } else {
            // sessionStorage is empty — user may have opened the URL in a new tab
            // or the browser cleared storage (private mode / crash). Poll the
            // stripe endpoint so the webhook has time to fulfill the order.
            setPaypalProcessing(true)
            let fulfilled = false
            for (let attempt = 0; attempt < 3; attempt++) {
              if (attempt > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000))
              }
              try {
                const pollRes = await fetch(`/api/checkout/stripe?payment_intent=${paymentIntentId}`)
                if (pollRes.ok) {
                  const pollData = await pollRes.json()
                  if (pollData.session?.id) {
                    setOrder(pollData.session)
                    setSeriesProgress(pollData.seriesProgress || [])
                    fulfilled = true
                    break
                  }
                }
              } catch {
                // continue polling
              }
            }
            setPaypalProcessing(false)
            if (!fulfilled) {
              setError(
                'We\'re still processing your order. Please check your email for confirmation, or contact support if you have questions.'
              )
            }
            setLoading(false)
            return
          }
        }

        const url = paymentIntentId
          ? `/api/checkout/stripe?payment_intent=${paymentIntentId}`
          : `/api/checkout/stripe?session_id=${sessionId}`
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order details')
        }

        setOrder(data.session)
        setSeriesProgress(data.seriesProgress || [])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong'
        setError(message)
        captureFunnelEvent(FunnelEvents.payment_error, { error_message: message, source: 'checkout_success' })
        tagSessionForReplay('payment-error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [orderParam, sessionId, paymentIntentId, isDemo])

  // Format price
  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md">
          <Container maxWidth="narrow">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#f5f5f5] animate-pulse" />
              {paypalProcessing ? (
                <>
                  <p className="text-lg font-medium text-[#1a1a1a] mb-2">We&apos;re processing your order&hellip;</p>
                  <p className="text-sm text-[#1a1a1a]/60">This usually takes just a moment. Please don&apos;t close this page.</p>
                </>
              ) : (
                <>
                  <div className="h-8 bg-[#f5f5f5] rounded w-2/3 mx-auto mb-4 animate-pulse" />
                  <div className="h-4 bg-[#f5f5f5] rounded w-1/2 mx-auto animate-pulse" />
                </>
              )}
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <main className="min-h-screen bg-white">
        <SectionWrapper spacing="md">
          <Container maxWidth="narrow">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#f83a3a]/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f83a3a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h1 className="font-heading text-2xl font-semibold text-[#1a1a1a] mb-2">
                Something went wrong
              </h1>
              <p className="text-[#1a1a1a]/60 mb-6">
                {error || 'Unable to load your order details.'}
              </p>
              <Link href="/shop">
                <Button variant="primary">Back to Shop</Button>
              </Link>
            </div>
          </Container>
        </SectionWrapper>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      <SectionWrapper spacing="md" background="muted">
        <Container maxWidth="narrow">
          {/* Demo mode banner — only when ?demo=1 */}
          {isDemo && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
              <strong>Preview mode</strong> — Showing mock order and payment ID so you can configure this page. Use{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">/shop/checkout/success?demo=1</code>{' '}
              anytime to preview.
            </div>
          )}
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#00a341] flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-heading text-impact-h2 xl:text-impact-h2-lg font-semibold text-[#1a1a1a] tracking-[-0.02em] mb-2">
              Thank you for your order!
            </h1>
            <p className="text-lg text-[#1a1a1a]/60">
              We&apos;ve sent a confirmation email to{' '}
              <span className="font-medium text-[#1a1a1a]">{order.customerEmail}</span>
            </p>
          </div>

          {/* Order Summary Card */}
          <Card variant="default" padding="lg" className="mb-6">
            <CardHeader
              title="Order Summary"
              subtitle={`Order ID: ${order.id.slice(-8).toUpperCase()}`}
            />
            <CardContent className="mt-6">
              {/* Line Items */}
              <div className="space-y-4 pb-6 border-b border-[#1a1a1a]/10">
                {order.lineItems?.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    {item.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#e5e5e5] flex-shrink-0">
                        <img
                          src={getProxiedImageUrl(item.imageUrl)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1a1a]">{item.description}</p>
                      <p className="text-sm text-[#1a1a1a]/60">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#1a1a1a] flex-shrink-0">
                      {formatPrice(item.amount, order.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4">
                <p className="text-lg font-medium text-[#1a1a1a]">Total</p>
                <p className="text-xl font-bold text-[#1a1a1a]">
                  {formatPrice(order.amountTotal, order.currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credits Earned Card — hidden for now */}

          {/* Shipping Address Card */}
          {order.shippingDetails?.address && (
            <Card variant="flat" padding="md" className="mb-6">
              <CardHeader title="Shipping Address" />
              <CardContent className="mt-4">
                <p className="text-[#1a1a1a]">{order.shippingDetails.name}</p>
                <p className="text-[#1a1a1a]/70">
                  {order.shippingDetails.address.line1}
                  {order.shippingDetails.address.line2 && (
                    <>, {order.shippingDetails.address.line2}</>
                  )}
                </p>
                <p className="text-[#1a1a1a]/70">
                  {order.shippingDetails.address.city}, {order.shippingDetails.address.state}{' '}
                  {order.shippingDetails.address.postal_code}
                </p>
                <p className="text-[#1a1a1a]/70">{order.shippingDetails.address.country}</p>
              </CardContent>
            </Card>
          )}

          {/* What's Next */}
          <Card variant="flat" padding="md" className="mb-8">
            <CardHeader title="What's Next?" />
            <CardContent className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#047AFF]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#047AFF]">1</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Order Confirmation</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    You&apos;ll receive an email confirmation shortly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#047AFF]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#047AFF]">2</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Production</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    Your artwork will be carefully prepared by our team.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#047AFF]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#047AFF]">3</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Shipping</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    We&apos;ll email you tracking information once shipped.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link href="/collector/dashboard">
                <Button variant="primary" size="lg">
                  View My Collection
                </Button>
              </Link>
            ) : (
              <Link href={`/shop/account`}>
                <Button variant="primary" size="lg">
                  Sign in
                </Button>
              </Link>
            )}
            <Link href="/shop/experience">
              <Button variant="outline" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Support */}
          <p className="text-center text-sm text-[#1a1a1a]/50 mt-8">
            Questions about your order?{' '}
            <a href="mailto:support@thestreetcollector.com" className="text-[#047AFF] hover:underline">
              Contact us
            </a>
          </p>
        </Container>
      </SectionWrapper>
    </main>
  )
}

export default CheckoutSuccessContent
