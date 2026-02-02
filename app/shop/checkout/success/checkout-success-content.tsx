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
 */

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

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrderDetails() {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/checkout/stripe?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order details')
        }

        setOrder(data.session)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [sessionId])

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
              We've sent a confirmation email to{' '}
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

          {/* What's Next */}
          <Card variant="flat" padding="md" className="mb-8">
            <CardHeader title="What's Next?" />
            <CardContent className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2c4bce]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#2c4bce]">1</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Order Confirmation</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    You'll receive an email confirmation shortly.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2c4bce]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#2c4bce]">2</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Production</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    Your artwork will be carefully prepared by our team.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2c4bce]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[#2c4bce]">3</span>
                </div>
                <div>
                  <p className="font-medium text-[#1a1a1a]">Shipping</p>
                  <p className="text-sm text-[#1a1a1a]/60">
                    We'll email you tracking information once shipped.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/collector/dashboard">
              <Button variant="primary" size="lg">
                View My Collection
              </Button>
            </Link>
            <Link href="/shop">
              <Button variant="outline" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Support */}
          <p className="text-center text-sm text-[#1a1a1a]/50 mt-8">
            Questions about your order?{' '}
            <a href="mailto:support@thestreetcollector.com" className="text-[#2c4bce] hover:underline">
              Contact us
            </a>
          </p>
        </Container>
      </SectionWrapper>
    </main>
  )
}

export default CheckoutSuccessContent
