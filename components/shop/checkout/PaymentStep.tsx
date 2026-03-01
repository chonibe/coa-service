'use client'

import * as React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Loader2, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CartLineItem {
  productId: string
  variantId: string
  variantGid: string
  handle: string
  title: string
  price: number
  quantity: number
  image?: string
}

export interface PaymentStepProps {
  items: CartLineItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  itemCount: number
  customerEmail?: string
  shippingAddress: {
    email?: string
    fullName?: string
    country?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    postalCode?: string
    phoneNumber?: string
  }
  onBack?: () => void
  onSuccess: (redirectUrl: string) => void
  onError: (message: string) => void
  renderTotal?: (value: number) => React.ReactNode
}

function PaymentFormInner({
  items,
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  shippingAddress,
  onBack,
  onSuccess,
  onError,
  renderTotal,
}: Omit<PaymentStepProps, 'customerEmail'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = React.useState(false)
  const [promoOpen, setPromoOpen] = React.useState(false)
  const [promoCode, setPromoCode] = React.useState('')
  const [promoApplied, setPromoApplied] = React.useState('')
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setPaymentError(null)

    try {
      // Persist checkout data for PayPal/redirect returns
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('sc_checkout_items', JSON.stringify(items))
        sessionStorage.setItem('sc_checkout_address', JSON.stringify(shippingAddress))
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: typeof window !== 'undefined'
            ? `${window.location.origin}/shop/checkout/success`
            : 'http://localhost:3000/shop/checkout/success',
          receipt_email: shippingAddress.email,
        },
        redirect: 'if_required',
      })

      if (error) {
        setPaymentError(error.message ?? 'Payment failed')
        setLoading(false)
        return
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const orderRes = await fetch('/api/checkout/complete-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            items,
            shippingAddress,
          }),
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok) {
          throw new Error(orderData.error || 'Order creation failed')
        }
        onSuccess(orderData.redirectUrl || `/shop/checkout/success?payment_intent=${paymentIntent.id}`)
        return
      }

      if (paymentIntent && paymentIntent.status === 'requires_action') {
        setPaymentError('Additional authentication required. Please try again.')
        setLoading(false)
        return
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setPaymentError(msg)
      onError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Promo code - collapsible */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setPromoOpen(!promoOpen)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            {promoApplied || 'Add promo code'}
          </span>
          {promoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {promoOpen && (
          <div className="px-3 pb-3 flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 h-8 rounded-md border border-neutral-200 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
            <button
              type="button"
              onClick={() => {
                if (promoCode.trim()) {
                  setPromoApplied(promoCode.trim().toUpperCase())
                  setPromoOpen(false)
                }
              }}
              className="h-8 px-3 rounded-md bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-neutral-950">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600">Discount</span>
            <span className="font-medium text-green-700">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium text-neutral-950">
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200">
          <span className="font-semibold text-neutral-950">Total</span>
          <span className="text-lg font-bold text-neutral-950">
            {renderTotal ? renderTotal(total) : `$${total.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div
        className="min-h-[200px] w-full"
        role="region"
        aria-label="Payment details"
      >
        <PaymentElement
          options={{
            layout: 'tabs',
            defaultCollapsed: false,
            paymentMethodOrder: ['card', 'google_pay', 'link', 'paypal'],
          }}
        />
      </div>

      {paymentError && (
        <p className="text-center text-xs text-red-500">{paymentError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-shrink-0 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || loading}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors',
            !stripe || loading
              ? 'cursor-not-allowed bg-neutral-200 text-neutral-500'
              : 'bg-neutral-950 text-white hover:bg-neutral-800'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${total.toFixed(2)}`
          )}
        </button>
      </div>
    </form>
  )
}

export function PaymentStep(props: PaymentStepProps) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [intentError, setIntentError] = React.useState<string | null>(null)
  const fetchedRef = React.useRef(false)

  React.useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    fetch('/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: props.items,
        customerEmail: props.customerEmail,
        shippingAddress: props.shippingAddress,
      }),
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Could not initialize payment')
        setClientSecret(data.clientSecret)
      })
      .catch((err) => setIntentError(err?.message || 'Could not load payment form'))
  }, [props.items, props.customerEmail, props.shippingAddress])

  if (!stripePromise) {
    return (
      <p className="text-sm text-amber-600 p-4">
        Payment configuration is missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    )
  }

  if (intentError) {
    return (
      <div className="space-y-3 p-2">
        <p className="text-sm text-red-500">{intentError}</p>
        {props.onBack && (
          <button
            type="button"
            onClick={props.onBack}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Back
          </button>
        )}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-neutral-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Preparing payment...</span>
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
      <PaymentFormInner {...props} />
    </Elements>
  )
}
