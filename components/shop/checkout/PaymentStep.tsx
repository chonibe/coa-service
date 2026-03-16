'use client'

import * as React from 'react'
import {
  CheckoutProvider,
  useCheckout,
  PaymentElement,
} from '@stripe/react-stripe-js/checkout'
import { Loader2, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/(store)/shop/experience/ExperienceThemeContext'
import type { Stripe } from '@stripe/stripe-js'
import { captureFunnelEvent, FunnelEvents } from '@/lib/posthog'

/** Lazy-load Stripe only when payment UI mounts (avoids loading on landing page prefetch) */
function useStripePromise() {
  const [promise, setPromise] = React.useState<Promise<Stripe | null> | null>(null)
  React.useEffect(() => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) return
    import('@stripe/stripe-js').then(({ loadStripe }) => setPromise(loadStripe(key)))
  }, [])
  return promise
}

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
  /** When true, renders only form + PaymentElement (for use with external submit button via formId). */
  compact?: boolean
  /** Form id for external submit button (e.g. button with form="checkout-payment-form") */
  formId?: string
  shippingAddress: {
    email?: string
    fullName?: string
    country?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    postalCode?: string
    phoneNumber?: string
  }
  onBack?: () => void
  onSuccess: (redirectUrl: string) => void
  onError: (message: string) => void
  renderTotal?: (value: number) => React.ReactNode
  /** Called when the selected payment method changes (e.g. "google_pay", "paypal", "card"). For card, optional cardInfo (brand, last4) when available. */
  onPaymentMethodChange?: (type: string, cardInfo?: { brand: string; last4: string }) => void
  /** Called when the checkout session has expired; parent can reset to fetch a new session */
  onSessionExpired?: () => void
  /** Preloaded clientSecret from parent (e.g. from cart drawer preload) – skips fetch when valid */
  preloadedClientSecret?: string | null
  /** Client secret for success redirect (passed from parent) */
  clientSecret?: string | null
  /** Ref for the form – parent can call requestSubmit() */
  formRef?: React.RefObject<HTMLFormElement | null>
  /** Called when a valid promo code is applied; parent should recreate the checkout session with the code */
  onPromoApplied?: (code: string) => void
  /** Pre-applied promo code (passed from parent context) */
  promoCode?: string
}

/** Mixtiles-inspired: PayPal blue, rectangular, 52px-style payment options */
const appearanceLight = {
  theme: 'stripe' as const,
  variables: {
    borderRadius: '4px',
    colorPrimary: '#0070ba',
    colorBackground: '#ffffff',
    colorText: '#171717',
    colorDanger: '#dc2626',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    buttonColorBackground: '#0070ba',
    accessibleColorOnColorPrimary: '#ffffff',
  },
  rules: {
    '.Tab': {
      borderRadius: '4px',
      padding: '14px 16px',
    },
    '.Tab--selected': {
      borderColor: '#0070ba',
      boxShadow: '0 0 0 2px #0070ba',
    },
  },
}

/** Dark mode appearance for Stripe card inputs – lighter backgrounds so PayPal/buttons stay visible */
const appearanceDark = {
  theme: 'stripe' as const,
  variables: {
    borderRadius: '4px',
    colorPrimary: '#0070ba',
    colorBackground: '#262626',
    colorText: '#ffffff',
    colorTextSecondary: '#a3a3a3',
    colorDanger: '#f87171',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    buttonColorBackground: '#0070ba',
    accessibleColorOnColorPrimary: '#ffffff',
  },
  rules: {
    '.Tab': {
      borderRadius: '4px',
      padding: '14px 16px',
      backgroundColor: '#2d2d2d',
    },
    '.Tab--selected': {
      borderColor: '#0070ba',
      boxShadow: '0 0 0 2px #0070ba',
    },
    '.Block': {
      backgroundColor: '#262626',
    },
  },
}

async function logCheckoutError(payload: {
  stage: string
  resultType?: string
  error?: string
  message?: string
  hasRedirectUrl?: boolean
}) {
  try {
    await fetch('/api/debug/checkout-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    /* ignore */
  }
}

function PaymentFormInner({
  items,
  subtotal,
  discount,
  shipping,
  total,
  itemCount,
  shippingAddress,
  customerEmail,
  onBack,
  onSuccess,
  onError,
  renderTotal,
  compact,
  formId,
  formRef,
  onPaymentMethodChange,
  onSessionExpired,
  onPromoApplied,
  clientSecret,
}: PaymentStepProps) {
  const handlePaymentChange = React.useCallback(
    (event: { value?: { type?: string; paymentMethod?: { card?: { brand?: string; last4?: string } }; card?: { brand?: string; last4?: string } } }) => {
      const type = event?.value?.type
      if (!type || !onPaymentMethodChange) return
      let cardInfo: { brand: string; last4: string } | undefined
      if (type === 'card') {
        const card = event.value?.paymentMethod?.card ?? event.value?.card
        const brand = typeof card?.brand === 'string' ? card.brand : undefined
        const last4 = typeof card?.last4 === 'string' ? card.last4 : undefined
        if (brand && last4) cardInfo = { brand, last4 }
      }
      onPaymentMethodChange(type, cardInfo)
    },
    [onPaymentMethodChange]
  )
  const checkoutState = useCheckout()

  /* Auto-select: Google Pay first (paymentMethodOrder), fallback to card when onChange fires */
  const hasReportedInitialRef = React.useRef(false)
  React.useEffect(() => {
    if (checkoutState.type === 'success' && onPaymentMethodChange && !hasReportedInitialRef.current) {
      hasReportedInitialRef.current = true
      onPaymentMethodChange('google_pay')
    }
  }, [checkoutState.type, onPaymentMethodChange])
  const [loading, setLoading] = React.useState(false)
  const [promoOpen, setPromoOpen] = React.useState(false)
  const [promoInput, setPromoInput] = React.useState('')
  const [promoApplied, setPromoApplied] = React.useState('')
  const [promoError, setPromoError] = React.useState<string | null>(null)
  const [promoLoading, setPromoLoading] = React.useState(false)
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const applyPromo = React.useCallback(async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: code }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setPromoError(data.error || 'Invalid or expired promo code.')
        return
      }
      setPromoApplied(code)
      setPromoOpen(false)
      // Notify parent so it can recreate the checkout session with the promo applied
      if (onPromoApplied) onPromoApplied(code)
    } catch {
      setPromoError('Could not validate promo code. Please try again.')
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput, onPromoApplied])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkoutState.type !== 'success') return
    const checkout = checkoutState.checkout
    
    // Get email from customerEmail prop or shippingAddress
    const email = customerEmail?.trim() || shippingAddress?.email?.trim()
    
    // Validate email is present for PayPal (required by Stripe)
    if (!email) {
      const errMsg = 'Email address is required for PayPal payments. Please add your email address.'
      setPaymentError(errMsg)
      onError(errMsg)
      return
    }
    
    setLoading(true)
    setPaymentError(null)

    try {
      // PayPal requires email to be set via updateEmail() before confirmation
      // This is required even if customer_email was set during session creation
      if (email && typeof checkout.updateEmail === 'function') {
        try {
          await checkout.updateEmail(email)
        } catch (updateErr) {
          // If updateEmail fails (e.g., email already set), continue anyway
          // The error might be that email is already set, which is fine
          console.debug('[PaymentStep] updateEmail result:', updateErr)
        }
      }
      
      // Do NOT pass email to confirm() — Stripe throws IntegrationError if customer_email
      // was already set on the CheckoutSession at creation time (which we always do).
      const result = await checkout.confirm({
        redirect: 'if_required',
      })

      if (result.type === 'error') {
        const errMsg = result.error?.message ?? 'Payment failed'
        const errorCode = result.error?.code
        const declineCode = (result.error as any)?.paymentFailed?.declineCode
        
        console.error('[PayPal] confirm error:', errMsg, result)
        logCheckoutError({
          stage: 'confirm',
          resultType: 'error',
          error: errMsg,
        })
        
        // Handle specific error types with actionable messages
        if (/email.*required|required.*email/i.test(errMsg)) {
          const emailErrorMsg = 'Email address is required for PayPal payments. Please add your email address to your shipping address.'
          setPaymentError(emailErrorMsg)
          onError(emailErrorMsg)
          setLoading(false)
          return
        }
        
        // Handle ZIP code errors
        if (declineCode === 'incorrect_zip' || /zip.*invalid|invalid.*zip/i.test(errMsg)) {
          const zipErrorMsg = 'Your card\'s ZIP code is invalid. Please check your billing address ZIP code matches your card.'
          setPaymentError(zipErrorMsg)
          onError(zipErrorMsg)
          setLoading(false)
          return
        }
        
        // Handle card details errors
        if (/card.*details|fill.*card|card.*information/i.test(errMsg)) {
          const cardErrorMsg = 'Please fill in your card details completely before submitting.'
          setPaymentError(cardErrorMsg)
          onError(cardErrorMsg)
          setLoading(false)
          return
        }
        
        // Generic error handling
        setPaymentError(errMsg)
        onError(errMsg)
        setLoading(false)
        const isExpired = /expired|session/i.test(errMsg)
        if (isExpired && onSessionExpired) onSessionExpired()
        return
      }

      if (result.type === 'redirect') {
        const redirectUrl = result.redirectUrl
        if (!redirectUrl || typeof redirectUrl !== 'string') {
          const errMsg = 'PayPal redirect URL was not received. Please try again.'
          console.error('[PayPal] redirect missing redirectUrl:', result)
          logCheckoutError({
            stage: 'confirm',
            resultType: 'redirect',
            hasRedirectUrl: false,
            message: 'redirectUrl missing',
          })
          setPaymentError(errMsg)
          onError(errMsg)
          setLoading(false)
          return
        }
        console.info('[PayPal] redirecting to:', redirectUrl.slice(0, 80) + '...')
        try {
          sessionStorage.setItem('sc_checkout_items', JSON.stringify(items))
          sessionStorage.setItem('sc_checkout_address', JSON.stringify(shippingAddress))
        } catch {
          /* ignore */
        }
        onSuccess(redirectUrl)
        return
      }

      if (result.type === 'success') {
        const sessionId =
          clientSecret && typeof clientSecret === 'string'
            ? clientSecret.split('_secret_')[0] || null
            : null
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const successUrl = sessionId
          ? `${baseUrl}/shop/checkout/success?session_id=${sessionId}`
          : `${baseUrl}/shop/checkout/success`
        onSuccess(successUrl)
        return
      }

      // Unexpected result type
      console.error('[PayPal] unexpected result:', result)
      logCheckoutError({
        stage: 'confirm',
        resultType: (result as { type?: string }).type ?? 'unknown',
        message: 'unexpected result type',
      })
      setPaymentError('Unexpected response. Please try again.')
      onError('Unexpected response. Please try again.')
      setLoading(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      console.error('[PayPal] confirm throw:', err)
      logCheckoutError({
        stage: 'confirm',
        error: msg,
        message: err instanceof Error ? err.stack : String(err),
      })
      
      // Handle specific PayPal email requirement error
      if (/email.*required|required.*email|IntegrationError.*email/i.test(msg)) {
        const emailErrorMsg = 'Email address is required for PayPal payments. Please add your email address to your shipping address.'
        setPaymentError(emailErrorMsg)
        onError(emailErrorMsg)
        captureFunnelEvent(FunnelEvents.payment_error, {
          error_type: 'email_required',
          error_message: msg,
          payment_method: 'paypal',
        })
        setLoading(false)
        return
      }
      
      // Handle ZIP code errors
      if (/zip.*invalid|invalid.*zip|incorrect.*zip/i.test(msg)) {
        const zipErrorMsg = 'Your card\'s ZIP code is invalid. Please check your billing address ZIP code matches your card.'
        setPaymentError(zipErrorMsg)
        onError(zipErrorMsg)
        captureFunnelEvent(FunnelEvents.payment_error, {
          error_type: 'zip_invalid',
          error_message: msg,
        })
        setLoading(false)
        return
      }
      
      // Handle card details errors
      if (/card.*details|fill.*card|card.*information/i.test(msg)) {
        const cardErrorMsg = 'Please fill in your card details completely before submitting.'
        setPaymentError(cardErrorMsg)
        onError(cardErrorMsg)
        captureFunnelEvent(FunnelEvents.payment_error, {
          error_type: 'card_details_incomplete',
          error_message: msg,
        })
        setLoading(false)
        return
      }
      
      setPaymentError(msg)
      onError(msg)
      captureFunnelEvent(FunnelEvents.payment_error, {
        error_type: 'generic',
        error_message: msg,
      })
      const isExpired = /expired|session/i.test(msg)
      if (isExpired && onSessionExpired) onSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  if (checkoutState.type === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-neutral-500 dark:text-[#c4a0a0]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading checkout...</span>
      </div>
    )
  }

  if (checkoutState.type === 'error') {
    return (
      <div className="space-y-3 p-2">
        <p className="text-sm text-red-500 dark:text-red-400">{checkoutState.error?.message ?? 'Checkout failed to load'}</p>
      </div>
    )
  }

  if (compact) {
    return (
      <form
        ref={formRef}
        id={formId}
        onSubmit={handleSubmit}
        className="space-y-4 stripe-payment-element"
      >
        <div className="min-h-[180px] w-full" role="region" aria-label="Payment details">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['google_pay', 'card', 'link', 'paypal'],
            }}
            onChange={handlePaymentChange}
          />
        </div>
        {paymentError && (
          <div className="space-y-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 border border-red-200 dark:border-red-800">
            <p className="text-center text-xs font-medium text-red-700 dark:text-red-300">{paymentError}</p>
            {paymentError.toLowerCase().includes('email') && (
              <p className="text-center text-xs text-red-600 dark:text-red-400">
                Update your shipping address with a valid email address.
              </p>
            )}
            {paymentError.toLowerCase().includes('zip') && (
              <p className="text-center text-xs text-red-600 dark:text-red-400">
                Check your ZIP/postal code matches your billing address.
              </p>
            )}
            {!paymentError.toLowerCase().includes('email') && !paymentError.toLowerCase().includes('zip') && (
              <p className="text-center text-xs text-red-600 dark:text-red-400">
                Check your payment details or try a different payment method.
              </p>
            )}
          </div>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Promo code - collapsible */}
      <div className="border border-neutral-200 dark:border-white/20 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setPromoOpen(!promoOpen)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#201c1c]/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            {promoApplied ? `${promoApplied} applied` : 'Add promo code'}
          </span>
          {promoOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {promoOpen && (
          <div className="px-3 pb-3 space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value)
                  setPromoError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyPromo()
                  }
                }}
                placeholder="Enter code"
                className="flex-1 h-8 rounded-md border border-neutral-200 dark:border-white/20 px-2.5 text-sm bg-transparent dark:bg-[#1a1616] dark:text-[#f0e8e8] focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#4a4444]"
              />
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="h-8 px-3 rounded-md bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515] text-xs font-medium hover:bg-neutral-800 dark:hover:bg-[#e8d4d4] transition-colors disabled:opacity-50"
              >
                {promoLoading ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <p className="text-xs text-red-500 dark:text-red-400">{promoError}</p>
            )}
          </div>
        )}
      </div>

      {/* Order summary */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-[#c4a0a0]">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium text-neutral-950 dark:text-white">${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span className="text-neutral-600 dark:text-[#c4a0a0]">Discount</span>
            <span className="font-medium text-green-700 dark:text-green-400">-${discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-neutral-600 dark:text-[#c4a0a0]">Shipping</span>
          <span className="font-medium text-neutral-950 dark:text-white">
            {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-neutral-200 dark:border-white/10">
          <span className="font-semibold text-neutral-950 dark:text-white">Total</span>
          <span className="text-lg font-bold text-neutral-950 dark:text-white">
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
            paymentMethodOrder: ['google_pay', 'card', 'link', 'paypal'],
          }}
          onChange={handlePaymentChange}
        />
      </div>

      {paymentError && (
        <div className="space-y-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">{paymentError}</p>
          {paymentError.toLowerCase().includes('email') && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Please update your shipping address with a valid email address, then try again.
            </p>
          )}
          {paymentError.toLowerCase().includes('zip') && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Please check your ZIP/postal code matches your billing address, then try again.
            </p>
          )}
          {paymentError.toLowerCase().includes('card') && !paymentError.toLowerCase().includes('zip') && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Please check your card details are correct, or try a different payment method.
            </p>
          )}
          {!paymentError.toLowerCase().includes('email') && 
           !paymentError.toLowerCase().includes('zip') && 
           !paymentError.toLowerCase().includes('card') && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Please check your payment details and try again, or use a different payment method.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-shrink-0 rounded-lg border border-neutral-200 dark:border-white/20 px-4 py-3 text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] hover:bg-neutral-50 dark:hover:bg-[#201c1c]/50 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors',
            loading
              ? 'cursor-not-allowed bg-neutral-200 dark:bg-[#201c1c] text-neutral-500 dark:text-[#c4a0a0]'
              : 'bg-neutral-950 dark:bg-[#f0e8e8] text-white dark:text-[#171515] hover:bg-neutral-800 dark:hover:bg-[#e8d4d4]'
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
  const stripePromise = useStripePromise()
  const { theme } = useExperienceTheme()
  const { preloadedClientSecret, promoCode, onPromoApplied, ...restProps } = props
  const [clientSecret, setClientSecret] = React.useState<string | null>(
    () => preloadedClientSecret ?? null
  )
  const [intentError, setIntentError] = React.useState<string | null>(null)
  const [retryKey, setRetryKey] = React.useState(0)
  const [appliedPromo, setAppliedPromo] = React.useState<string | undefined>(promoCode)
  const fetchedRef = React.useRef(!!preloadedClientSecret)

  const resetAndRetry = React.useCallback(() => {
    fetchedRef.current = false
    setClientSecret(null)
    setIntentError(null)
    setRetryKey((k) => k + 1)
  }, [])

  // When a promo code is applied, recreate the checkout session with the code
  const handlePromoApplied = React.useCallback((code: string) => {
    setAppliedPromo(code)
    fetchedRef.current = false
    setClientSecret(null)
    setIntentError(null)
    setRetryKey((k) => k + 1)
    if (onPromoApplied) onPromoApplied(code)
  }, [onPromoApplied])

  React.useEffect(() => {
    if (preloadedClientSecret) {
      setClientSecret(preloadedClientSecret)
      fetchedRef.current = true
    } else {
      fetchedRef.current = false
    }
  }, [preloadedClientSecret])

  React.useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    fetch('/api/checkout/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: props.items,
        customerEmail: props.customerEmail,
        shippingAddress: props.shippingAddress,
        ...(appliedPromo && { promoCode: appliedPromo }),
      }),
    })
      .then(async (r) => {
        const data = await r.json()
        if (!r.ok) throw new Error(data.error || 'Could not initialize checkout')
        setClientSecret(data.clientSecret)
      })
      .catch((err) => {
        setIntentError(err?.message || 'Could not load payment form')
        fetchedRef.current = false
      })
  }, [props.items, props.customerEmail, props.shippingAddress, retryKey, preloadedClientSecret, appliedPromo])

  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="text-sm text-amber-600 p-4">
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

  if (intentError) {
    return (
      <div className="space-y-3 p-2">
        <p className="text-sm text-red-500">{intentError}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetAndRetry}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Try again
          </button>
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

  const appearance = theme === 'dark' ? appearanceDark : appearanceLight

  return (
    <CheckoutProvider
      stripe={stripePromise}
      options={{
        clientSecret,
        elementsOptions: { appearance },
      }}
    >
      <PaymentFormInner
        {...restProps}
        clientSecret={clientSecret}
        onSessionExpired={props.onSessionExpired ?? resetAndRetry}
        onPromoApplied={handlePromoApplied}
      />
    </CheckoutProvider>
  )
}
