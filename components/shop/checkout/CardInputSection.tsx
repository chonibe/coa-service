'use client'

import * as React from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import type { SavedCardInfo } from '@/lib/shop/CheckoutContext'
import type { Stripe } from '@stripe/stripe-js'

/** Lazy-load Stripe only when component mounts (avoids loading on landing page) */
function useStripePromise() {
  const [promise, setPromise] = React.useState<Promise<Stripe | null> | null>(null)
  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) return
    import('@stripe/stripe-js').then(({ loadStripe }) => setPromise(loadStripe(key)))
  }, [])
  return promise
}

interface SetupFormInnerProps {
  customerEmail?: string
  onSuccess: (card: SavedCardInfo) => void
  onError: (message: string) => void
}

function SetupFormInner({ customerEmail, onSuccess, onError }: SetupFormInnerProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: typeof window !== 'undefined' ? `${window.location.origin}/experience` : undefined,
        },
        redirect: 'if_required',
      })
      if (error) {
        onError(error.message ?? 'Something went wrong')
        setLoading(false)
        return
      }
      const pmId = setupIntent?.payment_method
      if (!pmId || typeof pmId !== 'string') {
        onError('Could not save payment method')
        setLoading(false)
        return
      }
      const res = await fetch('/api/checkout/payment-method-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: pmId }),
      })
      const data = await res.json()
      if (!res.ok) {
        onError(data.error ?? 'Could not get card details')
        setLoading(false)
        return
      }
      onSuccess({
        paymentMethodId: pmId,
        brand: data.brand ?? 'card',
        last4: data.last4 ?? '••••',
      })
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="min-h-[300px] w-full overflow-visible"
        style={{ minHeight: 300 }}
        role="region"
        aria-label="Card details"
      >
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultCollapsed: false,
            radios: true,
            spellCheck: false,
            ...(customerEmail && {
              defaultValues: {
                billingDetails: { email: customerEmail },
              },
            }),
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save card'
        )}
      </button>
    </form>
  )
}

export interface CardInputSectionProps {
  clientSecret: string
  /** Customer email for Link prefilling (helps Link appear and auto-fill) */
  customerEmail?: string
  onSuccess: (card: SavedCardInfo) => void
  onError: (message: string) => void
}

export function CardInputSection({ clientSecret, customerEmail, onSuccess, onError }: CardInputSectionProps) {
  const stripePromise = useStripePromise()
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="text-sm text-amber-600">
        Payment configuration is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    )
  }
  if (!stripePromise) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading payment...</span>
      </div>
    )
  }
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            borderRadius: '8px',
            colorPrimary: '#0a0a0a',
            colorBackground: '#ffffff',
            colorText: '#171717',
            colorDanger: '#dc2626',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            spacingUnit: '4px',
          },
        },
      }}
    >
      <SetupFormInner customerEmail={customerEmail} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
