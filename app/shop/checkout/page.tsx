'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  CheckoutProvider,
  useCheckout,
  PaymentElement,
  BillingAddressElement,
  ShippingAddressElement,
} from '@stripe/react-stripe-js/checkout'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { getCheckoutItems, type CheckoutCartItem } from '@/lib/checkout/session-storage'
import { Button, Container, SectionWrapper } from '@/components/impact'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

export type { CheckoutCartItem }

function validateEmail(email: string, checkout: { updateEmail: (e: string) => Promise<{ type: string; error?: { message: string } }> }) {
  return checkout.updateEmail(email).then((result) => ({
    isValid: result.type !== 'error',
    message: result.type === 'error' ? result.error?.message ?? 'Invalid email' : null,
  }))
}

function CheckoutForm() {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const checkoutState = useCheckout()

  const handleBlur = useCallback(async () => {
    if (!email) return
    if (checkoutState.type !== 'success') return
    const { isValid, message: msg } = await validateEmail(email, checkoutState.checkout)
    if (!isValid) setEmailError(msg ?? 'Invalid email')
    else setEmailError(null)
  }, [email, checkoutState])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (checkoutState.type !== 'success') return

      const { checkout } = checkoutState
      setIsSubmitting(true)
      setMessage(null)

      const { isValid, message: validationMsg } = await validateEmail(email, checkout)
      if (!isValid) {
        setEmailError(validationMsg ?? 'Invalid email')
        setMessage(validationMsg ?? 'Please enter a valid email.')
        setIsSubmitting(false)
        return
      }

      const confirmResult = await checkout.confirm()
      if (confirmResult.type === 'error') {
        setMessage(confirmResult.error?.message ?? 'Payment failed. Please try again.')
      }
      setIsSubmitting(false)
    },
    [checkoutState, email]
  )

  if (checkoutState.type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <p className="mt-4 text-muted-foreground">Loading checkout…</p>
      </div>
    )
  }

  if (checkoutState.type === 'error') {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-destructive">
          Error: {checkoutState.error?.message ?? 'Failed to load checkout'}
        </p>
        <Link href="/shop" className="mt-3 inline-block text-primary hover:underline">
          ← Return to shop
        </Link>
      </div>
    )
  }

  const { checkout } = checkoutState
  const displayTotal =
    typeof checkout.total?.total?.amount === 'number'
      ? `$${(checkout.total.total.amount / 100).toFixed(2)}`
      : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="checkout-email" className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="checkout-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError(null)
          }}
          onBlur={handleBlur}
          placeholder="you@example.com"
          className={`w-full rounded-md border px-3 py-2 text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
            emailError ? 'border-destructive' : 'border-input'
          }`}
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <p id="email-error" className="mt-1 text-sm text-destructive" role="alert">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Billing address</h3>
        <BillingAddressElement
          options={{
            fields: {
              phone: 'always',
            },
          }}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Shipping address</h3>
        <ShippingAddressElement />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-foreground">Payment</h3>
        <PaymentElement id="payment-element" />
      </div>

      {message && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
          {message}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        loading={isSubmitting}
        disabled={isSubmitting}
        className="mt-4"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing…
          </>
        ) : (
          <>{displayTotal ? `Pay ${displayTotal} now` : 'Pay now'}</>
        )}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CheckoutCartItem[]>([])
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const items = getCheckoutItems()
    if (items.length > 0) setItems(items)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!items.length || !stripePromise) return

    let cancelled = false
    setError(null)

    fetch('/api/checkout/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.error) {
          setError(data.error)
          return
        }
        setClientSecret(data.clientSecret)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.message ?? 'Failed to create checkout session')
      })

    return () => {
      cancelled = true
    }
  }, [items])

  const appearance = useMemo(
    () => ({
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(217 91% 60%)',
        colorBackground: 'hsl(0 0% 100%)',
        colorText: 'hsl(222.2 47.4% 11.2%)',
        colorDanger: 'hsl(0 84.2% 60.2%)',
        borderRadius: '0.5rem',
      },
      rules: {
        '.Input': {
          border: '1px solid hsl(214.3 31.8% 91.4%)',
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
        '.Input:focus': {
          borderColor: 'hsl(217 91% 60%)',
          boxShadow: '0 0 0 2px hsl(217 91% 60% / 0.2)',
        },
      },
    }),
    []
  )

  const options = useMemo(
    () => ({
      clientSecret: clientSecret ?? undefined,
      appearance,
    }),
    [clientSecret, appearance]
  )

  if (loading) {
    return (
      <SectionWrapper>
        <Container>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="mt-4 text-muted-foreground">Loading…</p>
          </div>
        </Container>
      </SectionWrapper>
    )
  }

  if (!items.length) {
    return (
      <SectionWrapper>
        <Container className="max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">Your cart is empty</h2>
            <p className="mt-2 text-muted-foreground">
              Add items to your cart before checkout.
            </p>
            <Button asChild className="mt-6">
              <Link href="/shop">Continue shopping</Link>
            </Button>
          </div>
        </Container>
      </SectionWrapper>
    )
  }

  if (error) {
    return (
      <SectionWrapper>
        <Container className="max-w-md">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-lg font-semibold text-destructive">Checkout error</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/shop">Return to shop</Link>
            </Button>
          </div>
        </Container>
      </SectionWrapper>
    )
  }

  if (!clientSecret || !stripePromise) {
    return (
      <SectionWrapper>
        <Container>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <p className="mt-4 text-muted-foreground">Setting up checkout…</p>
          </div>
        </Container>
      </SectionWrapper>
    )
  }

  return (
    <SectionWrapper>
      <Container className="max-w-xl">
        <Link
          href="/shop"
          className="mb-6 inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <h1 className="mb-8 text-2xl font-semibold text-foreground">Checkout</h1>

        <CheckoutProvider stripe={stripePromise} options={options}>
          <CheckoutForm />
        </CheckoutProvider>
      </Container>
    </SectionWrapper>
  )
}
