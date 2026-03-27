'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import type { StreetReserveTierId } from '@/lib/shop/street-reserve-config'

const TIERS: Array<{
  id: StreetReserveTierId
  name: string
  priceLabel: string
  lockWindow: string
  bullets: string[]
}> = [
  {
    id: 'collector',
    name: 'Collector',
    priceLabel: '$8/mo',
    lockWindow: '30-day price lock',
    bullets: ['Occasional collectors', 'Lock today’s ladder price on artwork you choose'],
  },
  {
    id: 'curator',
    name: 'Curator',
    priceLabel: '$15/mo',
    lockWindow: '60-day price lock',
    bullets: ['Stage alerts as editions move', 'Longer window to complete checkout'],
  },
  {
    id: 'patron',
    name: 'Patron',
    priceLabel: '$25/mo',
    lockWindow: '90-day price lock',
    bullets: ['48h early access (when enabled)', 'Artist & process content'],
  },
]

function StreetReservePageContent() {
  const { isAuthenticated, loading } = useShopAuthContext()
  const params = useSearchParams()
  const subscribed = params.get('subscribed') === '1'
  const canceled = params.get('canceled') === '1'
  const [busy, setBusy] = useState<StreetReserveTierId | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const startCheckout = async (tier: StreetReserveTierId) => {
    setErr(null)
    setBusy(tier)
    try {
      const r = await fetch('/api/shop/reserve/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tier }),
      })
      const data = await r.json().catch(() => ({}))
      if (!r.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Checkout failed')
        return
      }
      if (data.url && typeof data.url === 'string') {
        window.location.href = data.url
        return
      }
      setErr('No checkout URL returned')
    } catch {
      setErr('Network error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="dark min-h-dvh bg-[#171515] text-[#FFBA94] px-5 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="text-center text-sm text-[#FFBA94]/70 mb-2">
          <Link href="/experience" className="underline underline-offset-2 hover:text-[#FFBA94]">
            ← Back to experience
          </Link>
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-center tracking-tight text-[#FFBA94] mb-2">
          The Reserve
        </h1>
        <p className="text-center text-[#FFBA94]/85 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          A membership that gives you time to pay at a frozen artwork price while the public ladder moves.
          Not a discount — a lock window. Edition numbers still assign through the same checkout pipeline after
          you pay.
        </p>

        {subscribed && (
          <div
            className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-center text-sm text-emerald-100"
            role="status"
          >
            Welcome to The Reserve — your subscription is active or finishing setup. Open the{' '}
            <Link href="/experience" className="underline font-medium">
              experience
            </Link>{' '}
            to build your lamp and checkout.
          </div>
        )}
        {canceled && (
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-[#FFBA94]/80">
            Checkout canceled — pick a tier when you’re ready.
          </div>
        )}
        {err && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-center text-sm text-red-100">
            {err}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={cn(
                'rounded-2xl border border-white/10 bg-[#201c1c]/80 p-5 flex flex-col',
                'shadow-lg shadow-black/20'
              )}
            >
              <h2 className="text-lg font-semibold text-white mb-1">{t.name}</h2>
              <p className="text-[#047AFF] font-semibold text-sm mb-1">{t.priceLabel}</p>
              <p className="text-xs text-[#FFBA94]/70 mb-3">{t.lockWindow}</p>
              <ul className="text-xs text-[#FFBA94]/85 space-y-1.5 mb-5 flex-1">
                {t.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading || busy !== null || !isAuthenticated}
                onClick={() => void startCheckout(t.id)}
                className={cn(
                  'w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-colors',
                  'bg-[#047AFF] hover:bg-[#0366d6] disabled:opacity-40 disabled:pointer-events-none'
                )}
              >
                {busy === t.id ? 'Redirecting…' : isAuthenticated ? 'Subscribe' : 'Sign in to subscribe'}
              </button>
            </div>
          ))}
        </div>

        {!isAuthenticated && !loading && (
          <p className="mt-6 text-center text-sm text-[#FFBA94]/70">
            <Link href="/shop/account?redirect=/shop/reserve" className="text-[#047AFF] underline font-medium">
              Sign in
            </Link>{' '}
            to start a Reserve membership.
          </p>
        )}

        <p className="mt-10 text-center text-xs text-[#FFBA94]/50 max-w-lg mx-auto leading-relaxed">
          Configure Stripe price IDs: STREET_RESERVE_STRIPE_PRICE_COLLECTOR, STREET_RESERVE_STRIPE_PRICE_CURATOR,
          STREET_RESERVE_STRIPE_PRICE_PATRON. Use POST /api/shop/reserve/lock with an artwork id to store a lock
          while your subscription is active.
        </p>
      </div>
    </div>
  )
}

export default function StreetReservePage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-dvh bg-[#171515] text-[#FFBA94] flex items-center justify-center px-5">
          <p className="text-sm text-[#FFBA94]/70">Loading…</p>
        </div>
      }
    >
      <StreetReservePageContent />
    </Suspense>
  )
}
