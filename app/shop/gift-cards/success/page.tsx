'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Gift, Loader2, Copy, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface GiftCardData {
  code: string
  amountCents: number
  currency: string
  recipientEmail?: string
}

function GiftCardSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const [data, setData] = useState<GiftCardData | null>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId?.trim()) {
      setStatus('error')
      setError('Missing session ID')
      return
    }

    let cancelled = false

    const fetchGiftCard = async () => {
      try {
        const res = await fetch(`/api/gift-cards/by-session?session_id=${encodeURIComponent(sessionId)}`)
        const json = await res.json()

        if (cancelled) return

        if (res.status === 200) {
          setData(json)
          setStatus('success')
        } else if (res.status === 202) {
          setStatus('pending')
          setError(json.error || 'Your gift card is being prepared.')
        } else if (res.status === 503 && json.status === 'provisioning_failed') {
          setStatus('error')
          setError(json.error || 'There was an issue preparing your gift card.')
        } else {
          setStatus('error')
          setError(json.error || 'Could not load gift card')
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setError('Something went wrong')
        }
      }
    }

    fetchGiftCard()
    return () => { cancelled = true }
  }, [sessionId])

  const handleCopy = () => {
    if (!data?.code) return
    navigator.clipboard.writeText(data.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#150000]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-400" />
          <p className="text-neutral-600 dark:text-[#c4a0a0]">Loading your gift card...</p>
        </div>
      </main>
    )
  }

  if (status === 'pending') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#150000] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">
            Almost ready
          </h1>
          <p className="text-neutral-600 dark:text-[#c4a0a0] mb-6">
            {error}
          </p>
          <p className="text-sm text-neutral-500 dark:text-[#b89090]">
            Check your email for the gift card code. If you don&apos;t see it within a few minutes, check your spam folder.
          </p>
          <Link href="/shop" className="inline-block mt-6 text-[#047AFF] hover:underline font-medium">
            Continue shopping
          </Link>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#150000] px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-neutral-950 dark:text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-neutral-600 dark:text-[#c4a0a0] mb-6">
            {error}
          </p>
          <Link href="/shop/contact">
            <Button className="bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#150000]">
              Contact Support
            </Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-[#150000] py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        <div className="w-20 h-20 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
          <Gift className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-950 dark:text-white mb-2">
          Gift card purchased!
        </h1>
        <p className="text-neutral-600 dark:text-[#c4a0a0] mb-8">
          {data?.recipientEmail
            ? `A $${((data?.amountCents ?? 0) / 100).toFixed(2)} gift card has been sent to ${data.recipientEmail}`
            : `Your $${((data?.amountCents ?? 0) / 100).toFixed(2)} gift card code is below. We've also sent it to your email.`}
        </p>

        {data?.code && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-neutral-700 dark:text-[#d4b8b8] mb-2">
              Gift card code
            </label>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-mono font-bold tracking-wider px-6 py-4 bg-white dark:bg-[#1c0202] border-2 border-neutral-200 dark:border-[#471a1a] rounded-lg text-neutral-950 dark:text-white">
                {data.code}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'p-3 rounded-lg border-2 transition-colors',
                  copied
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-neutral-200 dark:border-[#471a1a] hover:border-neutral-400 dark:hover:border-[#582020]'
                )}
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-6 h-6 text-neutral-600 dark:text-[#c4a0a0]" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/shop">
            <Button className="w-full sm:w-auto bg-neutral-900 dark:bg-[#f0e8e8] text-white dark:text-[#150000]">
              Continue shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/shop/gift-cards">
            <Button variant="outline" className="w-full sm:w-auto">
              Buy another gift card
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function GiftCardSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-[#150000]">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-400" />
        </main>
      }
    >
      <GiftCardSuccessContent />
    </Suspense>
  )
}
