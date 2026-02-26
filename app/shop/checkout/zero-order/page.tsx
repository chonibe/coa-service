'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'

/**
 * Zero-dollar checkout completion page.
 * For $0 orders (test or credit-only), creates the Shopify order directly.
 */
export default function ZeroOrderPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    if (!sessionId) return
    setStatus('loading')
    setError(null)

    try {
      const res = await fetch('/api/checkout/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          shippingAddress: null,
          billingAddress: null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order')
      }

      setOrderId(data.orderId)
      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-neutral-600 mb-4">No session ID. Go back and try checkout again.</p>
          <Link href="/shop/experience" className="text-neutral-900 font-medium underline">
            Back to experience
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Complete your $0 order</h1>
        <p className="text-neutral-500 text-sm mb-6">
          This will create the order in Shopify admin. No payment is required.
        </p>

        {status === 'idle' && (
          <button
            onClick={handleComplete}
            className="w-full h-12 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
          >
            Create order in Shopify
          </button>
        )}

        {status === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
            <span className="text-neutral-600">Creating order...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
            <span className="font-medium text-neutral-900">Order created in Shopify!</span>
            {orderId && (
              <span className="text-sm text-neutral-500">Order ID: {orderId}</span>
            )}
            <p className="text-xs text-neutral-500 text-center">
              Check Shopify Admin → Orders (not Draft orders). Tag: headless, zero-dollar-test
            </p>
            <Link
              href="/shop/experience"
              className="text-sm font-medium text-neutral-900 underline mt-2"
            >
              Back to experience
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
            <button
              onClick={handleComplete}
              className="w-full h-12 rounded-lg bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        <Link
          href="/shop/experience"
          className="block text-center text-sm text-neutral-500 hover:text-neutral-700 mt-6"
        >
          Cancel and go back
        </Link>
      </div>
    </main>
  )
}
