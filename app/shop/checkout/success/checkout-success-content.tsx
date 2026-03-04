'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
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

  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [seriesProgress, setSeriesProgress] = useState<SeriesProgressItem[]>([])

  useEffect(() => {
    async function fetchOrderDetails() {
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
              // Best-effort; order may already exist from inline flow
            } finally {
              sessionStorage.removeItem('sc_checkout_items')
              sessionStorage.removeItem('sc_checkout_address')
            }
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
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()

    fetch('/api/auth/roles', { credentials: 'include' })
      .then(res => { if (res.ok) setIsAuthenticated(true) })
      .catch(() => {})
  }, [orderParam, sessionId, paymentIntentId])

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
              <div className="h-8 bg-[#f5f5f5] rounded w-2/3 mx-auto mb-4 animate-pulse" />
              <div className="h-4 bg-[#f5f5f5] rounded w-1/2 mx-auto animate-pulse" />
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
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#1a1a1a]">{item.description}</p>
                      <p className="text-sm text-[#1a1a1a]/60">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#1a1a1a]">
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

          {/* Credits Earned */}
          {order.amountTotal > 0 && (
            <Card variant="default" padding="md" className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-white">
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">&#x1FA99;</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#1a1a1a] text-lg">
                      You earned {Math.round((order.amountTotal / 100) * CREDITS_PER_DOLLAR).toLocaleString()} credits!
                    </p>
                    <p className="text-sm text-[#1a1a1a]/60">
                      Worth ${((order.amountTotal / 100) * CREDITS_PER_DOLLAR * 0.10).toFixed(2)} towards future purchases. 10 credits = $1.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Series Progress */}
          {seriesProgress.length > 0 && (
            <Card variant="default" padding="md" className="mb-6 border-[#047AFF]/20 bg-gradient-to-r from-indigo-50 to-white">
              <CardContent>
                <h3 className="font-semibold text-[#1a1a1a] mb-4 flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047AFF" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Series Progress
                </h3>
                <div className="space-y-4">
                  {seriesProgress.map((sp) => {
                    const pct = sp.totalArtworks > 0
                      ? Math.round((sp.ownedCount / sp.totalArtworks) * 100)
                      : 0
                    const isComplete = sp.ownedCount >= sp.totalArtworks && sp.totalArtworks > 0
                    return (
                      <Link
                        key={sp.seriesId}
                        href={`/shop/series/${sp.seriesId}`}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#f5f5f5]/60 transition-colors group"
                      >
                        {sp.thumbnailUrl && (
                          <img
                            src={sp.thumbnailUrl}
                            alt={sp.seriesName}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#1a1a1a] text-sm truncate">
                            {sp.seriesName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isComplete ? 'bg-[#0a8754]' : 'bg-[#047AFF]'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#1a1a1a]/60 whitespace-nowrap">
                              {sp.ownedCount}/{sp.totalArtworks}
                            </span>
                          </div>
                          {isComplete ? (
                            <p className="text-xs text-[#0a8754] font-medium mt-1">
                              Series complete! Bonus credits earned.
                            </p>
                          ) : (
                            <p className="text-xs text-[#1a1a1a]/50 mt-1">
                              {sp.totalArtworks - sp.ownedCount} more to complete the series
                            </p>
                          )}
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" className="opacity-30 group-hover:opacity-60 transition-opacity flex-shrink-0">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claim CTA for guests / View Collection for authenticated users */}
          {!isAuthenticated && (
            <Card variant="default" padding="md" className="mb-6 border-[#047AFF]/20 bg-gradient-to-r from-blue-50 to-white">
              <CardContent>
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-[#1a1a1a] mb-2">
                    Claim Your Collection
                  </h3>
                  <p className="text-sm text-[#1a1a1a]/60 mb-4">
                    Create a free account to track your artworks, use your credits, and unlock exclusive perks.
                    Check your email for a claim link, or sign in now.
                  </p>
                  <Link href={`/login?redirect=/collector/dashboard&intent=collector`}>
                    <Button variant="primary" size="lg">
                      Create Free Account
                    </Button>
                  </Link>
                </div>
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
              <Link href={`/login?redirect=/collector/dashboard&intent=collector`}>
                <Button variant="primary" size="lg">
                  Claim Your Collection
                </Button>
              </Link>
            )}
            <Link href="/shop">
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
