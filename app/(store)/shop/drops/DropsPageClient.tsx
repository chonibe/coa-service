'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'
import { ladderStageBadgeClass, ladderStageShortLabel } from '@/lib/shop/collector-ladder-styles'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
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
    <div className="min-h-dvh bg-[#faf6f2] pb-16 text-stone-900 dark:bg-[#171515] dark:text-[#FFBA94]">
      <CollectorStoreTopChrome />
      <div className="pt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(6rem+env(safe-area-inset-top,0px))]" />

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
        <h1 className="text-2xl font-medium tracking-tight text-stone-900 dark:text-[#FFBA94] sm:text-3xl">
          All drops
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-[#FFBA94]/75">
          Live limited editions across the roster. Filter by ladder stage or search by artist or title.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-sm text-stone-600 dark:text-[#FFBA94]/70">
            <span className="mr-2">Stage</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as (typeof STAGES)[number]['id'])}
              className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-sm dark:border-white/15 dark:bg-[#201c1c]"
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
            className="w-full max-w-xs rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-[#201c1c] sm:w-64"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-sm text-stone-500 dark:text-[#FFBA94]/65">No editions match.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <Link
                key={r.handle}
                href={`/shop/${encodeURIComponent(r.handle)}`}
                className="group rounded-2xl border border-stone-200/90 bg-white/95 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#201c1c]/90"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
                    {r.stageKey === 'archive' ? 'Sold out' : 'Live'}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                      ladderStageBadgeClass(r.stageKey)
                    )}
                  >
                    {ladderStageShortLabel(r.stageKey)}
                  </span>
                </div>
                <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                  {r.imageUrl ? (
                    <Image
                      src={getProxiedImageUrl(r.imageUrl)}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                      sizes="(max-width:768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <p className="text-xs text-stone-500 dark:text-[#FFBA94]/65">{r.vendor}</p>
                <p className="font-medium text-stone-900 dark:text-[#FFBA94]">{r.title}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {r.priceUsd != null ? `$${r.priceUsd}` : '—'}
                  </span>
                  {r.editionTotal != null ? (
                    <span className="text-xs text-stone-500 dark:text-[#FFBA94]/65">
                      {r.editionsSold} / {r.editionTotal} sold
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
