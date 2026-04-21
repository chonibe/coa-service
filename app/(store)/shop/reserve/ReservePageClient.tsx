'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import type { StreetReserveTierId } from '@/lib/shop/street-reserve-config'
import { STREET_RESERVE_CHECKOUT_TIER } from '@/lib/shop/street-reserve-config'

const BENEFITS = [
  {
    n: '1',
    title: '48-hour early access',
    body: 'Every drop goes live for Reserve members two days before the public. Buy at ground floor before the ladder moves.',
    ring: 'bg-[#EEEDFE] text-[#26215C]',
  },
  {
    n: '2',
    title: 'Priority allocation',
    body: 'When a drop is in high demand, Reserve members who follow that artist get first allocation before general release.',
    ring: 'bg-[#E1F5EE] text-[#04342C]',
  },
  {
    n: '3',
    title: '$20/month drop credit',
    body: 'Your $20 rolls into monthly drop credit. Spend it when your artist drops. Rolls over up to 6 months — save up for the right piece.',
    ring: 'bg-[#FAEEDA] text-[#412402]',
  },
  {
    n: '4',
    title: 'Ground-floor price lock',
    body: 'Lock the ground-floor price on any edition for 30 days, even as the ladder climbs. Buy when you’re ready.',
    ring: 'bg-[#FAECE7] text-[#4A1B0C]',
  },
] as const

const TIMELINE = [
  { day: 'Day 1', text: 'Your $20 credit lands. You’re following the artists you care about on the roster.' },
  { day: 'Day 9', text: 'An artist announces a new drop for Thursday. You get the early-access window 48 hours before everyone else.' },
  { day: 'Day 11', text: 'Edition goes live for Reserve. You buy at ground-floor $40. $20 credit applied — you pay $20 net.' },
  { day: 'Day 13', text: 'Public drop opens. The edition is already at Rising tier ($52). You paid less than the next collector.' },
] as const

function ReserveInner() {
  const { isAuthenticated, loading } = useShopAuthContext()
  const params = useSearchParams()
  const subscribed = params.get('subscribed') === '1'
  const canceled = params.get('canceled') === '1'
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const startCheckout = async () => {
    const tier: StreetReserveTierId = STREET_RESERVE_CHECKOUT_TIER
    setErr(null)
    setBusy(true)
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
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh bg-[#faf6f2] pb-16 text-stone-900 dark:bg-[#171515] dark:text-[#FFBA94]">
      <CollectorStoreTopChrome />
      <div className="pt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(6rem+env(safe-area-inset-top,0px))]" />

      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {subscribed && (
          <div
            className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100"
            role="status"
          >
            Welcome to The Reserve — your subscription is active or finishing setup.{' '}
            <Link href="/shop/street-collector" className="font-medium underline underline-offset-2">
              Back to home
            </Link>
          </div>
        )}
        {canceled && (
          <div className="mb-4 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-center text-sm text-stone-600 dark:border-white/10 dark:bg-[#201c1c]/80 dark:text-[#FFBA94]/80">
            Checkout canceled — join when you’re ready.
          </div>
        )}
        {err && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-900 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-100">
            {err}
          </div>
        )}

        <section className="rounded-2xl bg-stone-900 px-6 py-8 text-white dark:bg-stone-950 dark:text-[#FFBA94] sm:px-8 sm:py-10">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/60 dark:text-[#FFBA94]/60">
            The Reserve · $20 per month
          </p>
          <h1 className="mb-3 max-w-lg text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            Never miss an artist you love.
          </h1>
          <p className="mb-6 max-w-lg text-[15px] leading-relaxed text-white/80 dark:text-[#FFBA94]/85">
            The Reserve gives you first access to every drop from the artists you follow — before they go public, at
            ground-floor pricing, with rolling credit that rolls into whatever you collect next.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={loading || busy || !isAuthenticated}
              onClick={() => void startCheckout()}
              className={cn(
                'rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition-opacity',
                'hover:opacity-95 disabled:pointer-events-none disabled:opacity-40',
                'dark:bg-[#FFBA94] dark:text-[#171515]'
              )}
            >
              {busy ? 'Redirecting…' : isAuthenticated ? 'Join for $20/month' : 'Sign in to join'}
            </button>
            <span className="text-xs text-white/55 dark:text-[#FFBA94]/55">Cancel anytime</span>
          </div>
          {!isAuthenticated && !loading && (
            <p className="mt-4 text-sm text-white/70 dark:text-[#FFBA94]/70">
              <Link href="/shop/account?redirect=/shop/reserve" className="font-medium underline underline-offset-2">
                Sign in
              </Link>{' '}
              to start checkout.
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {BENEFITS.map((b) => (
            <div
              key={b.n}
              className="rounded-2xl border border-stone-200/90 bg-white/95 p-5 shadow-sm dark:border-white/10 dark:bg-[#201c1c]/90"
            >
              <div
                className={cn(
                  'mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                  b.ring
                )}
              >
                {b.n}
              </div>
              <h2 className="mb-1.5 text-[15px] font-medium tracking-tight text-stone-900 dark:text-[#FFBA94]">
                {b.title}
              </h2>
              <p className="text-sm leading-relaxed text-stone-600 dark:text-[#FFBA94]/75">{b.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-stone-200/90 bg-white/95 p-6 dark:border-white/10 dark:bg-[#201c1c]/90">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
            How a month with The Reserve works
          </p>
          <div className="flex flex-col gap-4">
            {TIMELINE.map((row) => (
              <div key={row.day} className="flex gap-4">
                <div className="w-14 shrink-0 pt-0.5 text-[11px] text-stone-500 dark:text-[#FFBA94]/65">
                  {row.day}
                </div>
                <p className="text-[13px] leading-relaxed text-stone-800 dark:text-[#FFBA94]/90">{row.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-stone-200/90 bg-white/95 p-6 dark:border-white/10 dark:bg-[#201c1c]/90">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
            What it costs, what you save
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-stone-100/90 p-4 dark:bg-white/5">
              <p className="text-[11px] text-stone-500 dark:text-[#FFBA94]/65">Annual cost</p>
              <p className="text-2xl font-medium text-stone-900 dark:text-[#FFBA94]">$240</p>
            </div>
            <div className="rounded-xl bg-stone-100/90 p-4 dark:bg-white/5">
              <p className="text-[11px] text-stone-500 dark:text-[#FFBA94]/65">Typical collector saves</p>
              <p className="text-2xl font-medium text-stone-900 dark:text-[#FFBA94]">~$120 / year</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-stone-500 dark:text-[#FFBA94]/60">
            Based on collectors buying several editions per year at ground floor rather than rising or established
            pricing. Credit rolls for months so you are not losing what you paid in.
          </p>
        </section>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-stone-500 dark:text-[#FFBA94]/50">
          Set <code className="rounded bg-stone-200/80 px-1 dark:bg-white/10">STREET_RESERVE_STRIPE_PRICE_RESERVE</code>{' '}
          in the environment to your Stripe recurring price for $20/mo. Legacy tiers (collector/curator/patron) remain
          in the database for existing subscribers.
        </p>
      </div>
    </div>
  )
}

export function ReservePageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#faf6f2] text-stone-600 dark:bg-[#171515] dark:text-[#FFBA94]/70">
          Loading…
        </div>
      }
    >
      <ReserveInner />
    </Suspense>
  )
}
