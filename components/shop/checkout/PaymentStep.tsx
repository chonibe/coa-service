'use client'

import * as React from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  CheckoutProvider,
  useCheckout,
  PaymentElement,
} from '@stripe/react-stripe-js/checkout'
import { Loader2, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperienceTheme } from '@/app/shop/experience/ExperienceThemeContext'

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
  onBack,
  onSuccess,
  onError,
  renderTotal,
  compact,
  formId,
  formRef,
  onPaymentMethodChange,
  onSessionExpired,
  clientSecret,
}: Omit<PaymentStepProps, 'customerEmail'>) {
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
  const [promoCode, setPromoCode] = React.useState('')
  const [promoApplied, setPromoApplied] = React.useState('')
  const [paymentError, setPaymentError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (checkoutState.type !== 'success') return
    const checkout = checkoutState.checkout
    setLoading(true)
    setPaymentError(null)

    try {
      // redirect: 'if_required' ensures we get redirectUrl for PayPal instead of Stripe
      // auto-redirecting (which can fail inside modals). For card we get 'success'.
      const result = await checkout.confirm({ redirect: 'if_required' })

      if (result.type === 'error') {
        const errMsg = result.error?.message ?? 'Payment failed'
        console.error('[PayPal] confirm error:', errMsg, result)
        logCheckoutError({
          stage: 'confirm',
          resultType: 'error',
          error: errMsg,
        })
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
      setPaymentError(msg)
      onError(msg)
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
          <div className="space-y-2">
            <p className="text-center text-xs text-red-500 dark:text-red-400">{paymentError}</p>
            <p className="text-center text-xs text-neutral-500 dark:text-[#c4a0a0]">
              Try a different payment method or card, then try again.
            </p>
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
              className="flex-1 h-8 rounded-md border border-neutral-200 dark:border-white/20 px-2.5 text-sm bg-transparent dark:bg-[#1a1616] dark:text-[#f0e8e8] focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-[#4a4444]"
            />
            <button
              type="button"
              onClick={() => {
                if (promoCode.trim()) {
                  setPromoApplied(promoCode.trim().toUpperCase())
                  setPromoOpen(false)
                }
              }}
              className="h-8 px-3 rounded-md bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#171515] text-xs font-medium hover:bg-neutral-800 dark:hover:bg-[#e8d4d4] transition-colors"
            >
              Apply
            </button>
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
        <div className="space-y-2 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2">
          <p className="text-sm text-red-600 dark:text-red-400">{paymentError}</p>
          <p className="text-xs text-neutral-600 dark:text-[#c4a0a0]">
            Try a different payment method or card, then try again.
          </p>
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
  const { theme } = useExperienceTheme()
  const { preloadedClientSecret, ...restProps } = props
  const [clientSecret, setClientSecret] = React.useState<string | null>(
    () => preloadedClientSecret ?? null
  )
  const [intentError, setIntentError] = React.useState<string | null>(null)
  const [retryKey, setRetryKey] = React.useState(0)
  const fetchedRef = React.useRef(!!preloadedClientSecret)

  const resetAndRetry = React.useCallback(() => {
    fetchedRef.current = false
    setClientSecret(null)
    setIntentError(null)
    setRetryKey((k) => k + 1)
  }, [])

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
  }, [props.items, props.customerEmail, props.shippingAddress, retryKey, preloadedClientSecret])

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
      />
    </CheckoutProvider>
  )
}
