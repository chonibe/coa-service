'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PENDING_KEY = 'sc_paypal_pending'

function PayPalReturnContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing order token')
      setStatus('error')
      return
    }

    const pending = typeof window !== 'undefined' ? sessionStorage.getItem(PENDING_KEY) : null
    let parsed: { items?: unknown[]; shippingAddress?: Record<string, unknown> } | null = null
    if (pending) {
      try {
        parsed = JSON.parse(pending)
      } catch {
        parsed = null
      }
    }

    const doCapture = async () => {
      try {
        const res = await fetch('/api/checkout/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: token,
            shippingAddress: parsed?.shippingAddress || {},
            items: parsed?.items?.map((i: { variantId?: string; quantity?: number; handle?: string }) => ({
              variantId: (i.variantId || '').replace('gid://shopify/ProductVariant/', ''),
              quantity: i.quantity ?? 1,
              productHandle: i.handle,
            })),
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Capture failed')
        if (typeof window !== 'undefined') sessionStorage.removeItem(PENDING_KEY)
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
          return
        }
        setStatus('success')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Payment could not be completed')
        setStatus('error')
      }
    }

    doCapture()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-pink-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Completing your order...</p>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Something went wrong</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <Link
            href="/shop/experience"
            className="inline-block px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800"
          >
            Return to checkout
          </Link>
        </div>
      </main>
    )
  }

  return null
}

/**
 * PayPal return page - handles redirect flow when user completes PayPal on external page.
 * Reads token from URL, captures the order, redirects to success.
 */
export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-12 h-12 border-4 border-neutral-200 border-t-pink-600 rounded-full animate-spin" />
        </main>
      }
    >
      <PayPalReturnContent />
    </Suspense>
  )
}
