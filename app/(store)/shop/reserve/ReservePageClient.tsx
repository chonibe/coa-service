'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import { collectorStoreChromePaddingTopClass } from '@/lib/shop/collector-store-chrome-layout'
import { landingFontVariables } from '../home-v2/landing-fonts'
import landingStyles from '../home-v2/landing.module.css'
import exploreStyles from '../explore-artists/explore-artists.module.css'
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
    <div className={cn(landingFontVariables, landingStyles.page, 'min-h-dvh pb-16')}>
      <CollectorStoreTopChrome />
      <div className={collectorStoreChromePaddingTopClass} />

      <div className={exploreStyles.wrap}>
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
          {subscribed && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-center text-sm"
              style={{
                borderColor: 'rgba(52, 211, 153, 0.35)',
                background: 'rgba(6, 78, 59, 0.35)',
                color: 'rgba(236, 253, 245, 0.95)',
              }}
              role="status"
            >
              Welcome to The Reserve — your subscription is active or finishing setup.{' '}
              <Link href="/shop/street-collector" className="font-medium underline underline-offset-2">
                Back to home
              </Link>
            </div>
          )}
          {canceled && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-center text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--muted)' }}
            >
              Checkout canceled — join when you’re ready.
            </div>
          )}
          {err && (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-center text-sm"
              style={{ borderColor: 'rgba(248, 113, 113, 0.4)', background: 'rgba(127, 29, 29, 0.25)', color: '#fecaca' }}
            >
              {err}
            </div>
          )}
        </div>

        <section className={exploreStyles.featuredSection} aria-label="The Reserve">
          <div className={exploreStyles.featuredHeader}>
            <div>
              <div className={exploreStyles.eyebrowInline}>Membership</div>
              <h1 className={exploreStyles.featuredTitle}>
                The <em>Reserve</em>
              </h1>
            </div>
          </div>
          <div className="mx-auto max-w-2xl px-6 pb-16 text-center sm:px-10">
            <p className={exploreStyles.philosophyBody}>
              Never miss an artist you love. First access to every drop from the artists you follow — before they go
              public — at ground-floor pricing, with rolling credit toward what you collect next.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                disabled={loading || busy || !isAuthenticated}
                onClick={() => void startCheckout()}
                className={cn(exploreStyles.btnFeatured, 'border-0 disabled:opacity-40')}
              >
                {busy ? 'Redirecting…' : isAuthenticated ? 'Join for $20/month' : 'Sign in to join'}
              </button>
              <span className={exploreStyles.featuredRotate}>Cancel anytime</span>
            </div>
            {!isAuthenticated && !loading && (
              <p className="mt-6 text-sm" style={{ color: 'var(--muted)' }}>
                <Link href="/shop/account?redirect=/shop/reserve" className="font-medium" style={{ color: 'var(--peach)' }}>
                  Sign in
                </Link>{' '}
                to start checkout.
              </p>
            )}
          </div>
        </section>

        <section className={exploreStyles.voicesSection} aria-label="Benefits">
          <div className={exploreStyles.voicesHeader}>
            <h2 className={exploreStyles.voicesTitle}>
              What you <em>get</em>
            </h2>
          </div>
          <div className={exploreStyles.voicesGrid}>
            {BENEFITS.map((b) => (
              <div key={b.n} className={exploreStyles.voiceCard}>
                <div>
                  <div
                    className={cn(
                      'mb-4 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold',
                      b.ring
                    )}
                  >
                    {b.n}
                  </div>
                  <p className={exploreStyles.featuredHook} style={{ marginBottom: 12 }}>
                    {b.title}
                  </p>
                  <p className={exploreStyles.voiceText}>{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={exploreStyles.philosophy} aria-label="Timeline">
          <div className={exploreStyles.philosophyInner}>
            <div className={exploreStyles.philosophyEyebrow}>First month</div>
            <p className={exploreStyles.philosophyQuote}>How a month with The Reserve tends to feel.</p>
            <div className="mx-auto mt-8 max-w-xl text-left">
              {TIMELINE.map((row) => (
                <div key={row.day} className="mb-6 flex gap-4 border-b border-white/5 pb-6 last:mb-0 last:border-0 last:pb-0">
                  <div className="w-16 shrink-0 pt-1" style={{ color: 'var(--peach)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {row.day}
                  </div>
                  <p className={exploreStyles.philosophyBody} style={{ margin: 0, textAlign: 'left' }}>
                    {row.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={exploreStyles.mapSection} aria-label="Pricing">
          <div className={exploreStyles.mapEyebrow}>Value</div>
          <h2 className={exploreStyles.mapTitle} style={{ marginBottom: 40 }}>
            What it costs, <em>what you save</em>
          </h2>
          <div className={exploreStyles.mapStats}>
            <div className={exploreStyles.mapStat}>
              <span className={exploreStyles.mapStatN}>$240</span>
              <span className={exploreStyles.mapStatL}>Annual cost</span>
            </div>
            <div className={exploreStyles.mapStat}>
              <span className={exploreStyles.mapStatN}>~$120</span>
              <span className={exploreStyles.mapStatL}>Typical savings / yr</span>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-xl text-pretty text-sm" style={{ color: 'var(--muted)' }}>
            Based on collectors buying several editions per year at ground floor rather than rising or established
            pricing. Credit rolls for months so you are not losing what you paid in.
          </p>
        </section>

        <p className="px-6 py-10 text-center text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          Set <code style={{ background: 'var(--card2)', padding: '2px 6px', borderRadius: 4 }}>STREET_RESERVE_STRIPE_PRICE_RESERVE</code>{' '}
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
        <div
          className={cn(landingFontVariables, landingStyles.page, 'flex min-h-dvh items-center justify-center')}
          style={{ color: 'var(--muted)' }}
        >
          Loading…
        </div>
      }
    >
      <ReserveInner />
    </Suspense>
  )
}
