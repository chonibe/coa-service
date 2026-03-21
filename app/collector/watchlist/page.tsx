'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { captureFunnelEvent } from '@/lib/posthog'
import { Button } from '@/components/ui'
import { ArrowLeft, Bell } from 'lucide-react'

type WatchRow = {
  id: string
  shopify_product_id: string
  stage_at_save: string
  product_title: string | null
  product_handle: string | null
  artist_name: string | null
  created_at: string
}

export default function CollectorWatchlistPage() {
  const [items, setItems] = useState<WatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const viewedFired = useRef(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/shop/watchlist', { credentials: 'include' })
      const j = await r.json()
      if (r.ok && Array.isArray(j.items)) {
        setItems(j.items)
        if (!viewedFired.current) {
          viewedFired.current = true
          const available = j.items.filter((x: WatchRow) => x.stage_at_save !== 'soldOut').length
          captureFunnelEvent('watchlist_page_viewed', {
            total_watching: j.items.length,
            available_count: available,
          })
        }
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const counts = useMemo(() => {
    const available = items.filter((x) => x.stage_at_save !== 'soldOut').length
    return { total: items.length, available }
  }, [items])

  const remove = async (productId: string) => {
    setRemoving(productId)
    try {
      const r = await fetch('/api/shop/watchlist', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopify_product_id: productId }),
      })
      if (r.ok) setItems((prev) => prev.filter((x) => x.shopify_product_id !== productId))
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#141010] px-4 py-8 max-w-lg mx-auto font-body">
      <Link
        href="/collector/home"
        className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-[#c4a0a0] hover:text-neutral-900 dark:hover:text-[#f0e8e8] mb-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="h-11 w-11 shrink-0 rounded-impact-block-sm bg-gradient-to-br from-[#390000] to-[#5a1a1a] flex items-center justify-center shadow-sm"
          aria-hidden
        >
          <Bell className="h-5 w-5 text-[#ffba94]" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-[#f4f0f0] font-body">Edition watchlist</h1>
          <p className="text-sm text-neutral-600 dark:text-[#b0a0a0]">
            {loading ? 'Loading…' : `${counts.total} watching · ${counts.available} in progress`}
          </p>
        </div>
      </div>

      <p className="text-sm text-neutral-600 dark:text-[#a89898] mb-6 leading-relaxed">
        We email you when an edition you watch moves to a new stage (once per stage).
      </p>

      {loading ? (
        <p className="text-sm text-neutral-500 dark:text-[#908080]">Loading your list…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-600 dark:text-[#a89898] leading-relaxed">
          Nothing here yet. Browse the{' '}
          <Link
            href="/experience"
            className="font-semibold text-[#390000] dark:text-[#ffba94] underline underline-offset-2 decoration-[#ffba94]/50 dark:decoration-[#ffba94]/40"
          >
            experience
          </Link>{' '}
          and tap &quot;Watch this edition&quot; on an edition badge.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => {
            const href = row.product_handle ? `/shop/${row.product_handle}` : '/experience'
            return (
              <li
                key={row.id}
                className="rounded-impact-block-sm border-2 border-neutral-200/90 dark:border-[#3d3636] bg-white dark:bg-[#1c1818] p-4 dark:shadow-black/20"
              >
                <div className="flex justify-between gap-3 items-start">
                  <div className="min-w-0">
                    <Link
                      href={href}
                      className="font-semibold text-neutral-900 dark:text-[#f0e8e8] hover:text-[#390000] dark:hover:text-[#ffba94] block truncate transition-colors"
                    >
                      {row.product_title || 'Edition'}
                    </Link>
                    {row.artist_name && (
                      <p className="text-xs text-neutral-600 dark:text-[#a89898] mt-0.5">{row.artist_name}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 dark:text-[#806868] mt-2">
                      Stage when saved: {row.stage_at_save}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#908080] dark:hover:text-[#f0e8e8] hover:bg-neutral-100 dark:hover:bg-white/5"
                    disabled={removing === row.shopify_product_id}
                    onClick={() => void remove(row.shopify_product_id)}
                  >
                    {removing === row.shopify_product_id ? '…' : 'Remove'}
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
