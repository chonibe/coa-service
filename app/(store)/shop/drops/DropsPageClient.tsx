'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'
import { ladderStageShortLabel } from '@/lib/shop/collector-ladder-styles'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import { collectorStoreChromePaddingTopClass } from '@/lib/shop/collector-store-chrome-layout'
import { landingFontVariables } from '../home-v2/landing-fonts'
import landingStyles from '../home-v2/landing.module.css'
import exploreStyles from '../explore-artists/explore-artists.module.css'
import { cn } from '@/lib/utils'

export type DropRow = {
  handle: string
  title: string
  vendor?: string
  imageUrl?: string | null
  productId: string
  stageKey: StreetPricingStageKey
  priceUsd: number | null
  editionsSold: number
  editionTotal: number | null
}

const STAGES: Array<{ id: 'all' | StreetPricingStageKey; label: string }> = [
  { id: 'all', label: 'All stages' },
  { id: 'ground_floor', label: 'Ground floor' },
  { id: 'rising', label: 'Rising' },
  { id: 'established', label: 'Established' },
  { id: 'final', label: 'Final' },
  { id: 'archive', label: 'Sold out' },
]

const fieldShell = {
  background: 'var(--card)' as const,
  color: 'var(--white)' as const,
  border: '1px solid var(--border)' as const,
}

export function DropsPageClient({ rows }: { rows: DropRow[] }) {
  const [stage, setStage] = useState<(typeof STAGES)[number]['id']>('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (stage !== 'all' && r.stageKey !== stage) return false
      if (!needle) return true
      return (
        r.title.toLowerCase().includes(needle) ||
        (r.vendor && r.vendor.toLowerCase().includes(needle)) ||
        r.handle.toLowerCase().includes(needle)
      )
    })
  }, [rows, stage, q])

  return (
    <div className={cn(landingFontVariables, landingStyles.page, 'min-h-dvh pb-16')}>
      <CollectorStoreTopChrome />
      <div className={collectorStoreChromePaddingTopClass} />

      <div className={exploreStyles.wrap}>
        <section className={exploreStyles.artistsSection} aria-label="All drops">
          <div className={exploreStyles.artistsHeader}>
            <div>
              <div className={exploreStyles.eyebrowInline}>Shop</div>
              <h1 className={exploreStyles.featuredTitle}>
                All <em>drops</em>
              </h1>
            </div>
            <p className={exploreStyles.artistsHeaderNote}>
              Live limited editions across the roster. Filter by ladder stage or search by artist or title.
            </p>
          </div>

          <div
            className={cn(exploreStyles.filterBar, '!relative !top-0')}
            style={{ flexWrap: 'wrap', gap: 12, paddingTop: 12, paddingBottom: 12 }}
          >
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Stage
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as (typeof STAGES)[number]['id'])}
                className="rounded-md px-2 py-1.5 text-[11px] font-medium normal-case tracking-normal"
                style={fieldShell}
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="search"
              placeholder="Search artist or title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-[200px] flex-1 rounded-md px-3 py-2 text-sm sm:max-w-xs"
              style={fieldShell}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No editions match.
            </p>
          ) : (
            <div className={exploreStyles.artistsGrid}>
              {filtered.map((r) => (
                <article key={r.handle} className={exploreStyles.artistCard}>
                  <div className={exploreStyles.artistCardInner}>
                    <Link
                      href={`/shop/${encodeURIComponent(r.handle)}`}
                      prefetch={false}
                      className={exploreStyles.artistCardMediaButton}
                      aria-label={r.title}
                    >
                      <div className={exploreStyles.artistCardMedia}>
                        {r.imageUrl ? (
                          <Image
                            className={exploreStyles.artistCardImg}
                            src={getProxiedImageUrl(r.imageUrl)}
                            alt=""
                            fill
                            sizes="(max-width:768px) 50vw, 25vw"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-3xl"
                            style={{
                              background: 'linear-gradient(145deg, #2a1818 0%, #171515 100%)',
                              color: 'var(--peach)',
                              fontFamily: 'var(--font-landing-serif), Georgia, serif',
                            }}
                            aria-hidden
                          >
                            {(r.vendor || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={exploreStyles.artistCardOverlay} aria-hidden />
                        <div className={exploreStyles.artistCardInfo}>
                          <div className={exploreStyles.artistCardName}>{r.vendor || 'Artist'}</div>
                          <div className={exploreStyles.artistCardCity}>
                            {r.stageKey === 'archive' ? 'Sold out' : 'Live'} · {ladderStageShortLabel(r.stageKey)}
                          </div>
                          <div className={exploreStyles.artistCardHook}>{r.title}</div>
                        </div>
                      </div>
                    </Link>
                    <div className={exploreStyles.artistCardFooter}>
                      <div className={exploreStyles.editionsCount}>
                        <span className="tabular-nums">{r.priceUsd != null ? `$${r.priceUsd}` : '—'}</span>
                        {r.editionTotal != null ? (
                          <span className="tabular-nums">
                            {r.editionsSold} / {r.editionTotal}
                          </span>
                        ) : null}
                      </div>
                      <span className={exploreStyles.cardExploreLink} aria-hidden>
                        View
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
