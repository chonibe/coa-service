'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { captureFunnelEvent } from '@/lib/posthog'
import {
  getEditionStageKey,
  type EditionStageKey,
} from '@/lib/shop/edition-stages'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'

const PENDING_KEY = 'sc_watchlist_pending'

type PendingPayload = {
  productId: string
  stage: EditionStageKey
  product_title?: string
  product_handle?: string
  artist_name?: string
}

export function EditionWatchControl({
  product,
  editionNumberSold,
  totalEditions,
  artistName,
  compact,
  chipOnly,
  className,
}: {
  product: ShopifyProduct
  editionNumberSold: number
  totalEditions: number
  artistName: string
  compact?: boolean
  chipOnly?: boolean
  className?: string
}) {
  const { isAuthenticated, loading: authLoading } = useShopAuthContext()
  const [watching, setWatching] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  const stage = useMemo(
    () => getEditionStageKey(editionNumberSold, totalEditions),
    [editionNumberSold, totalEditions]
  )
  const soldOut = stage === 'soldOut'
  const normalizedProductId = useMemo(() => normalizeShopifyProductId(product.id), [product.id])

  const refreshStatus = useCallback(async () => {
    if (!normalizedProductId) return
    try {
      const r = await fetch(
        `/api/shop/watchlist?product_id=${encodeURIComponent(normalizedProductId)}`,
        { credentials: 'include' }
      )
      const j = await r.json()
      if (r.ok) setWatching(!!j.watching)
      else setWatching(false)
    } catch {
      setWatching(false)
    }
  }, [normalizedProductId])

  useEffect(() => {
    if (authLoading || !normalizedProductId) return
    if (!isAuthenticated) {
      setWatching(false)
      return
    }
    refreshStatus()
  }, [authLoading, isAuthenticated, normalizedProductId, refreshStatus])

  const savePayload = useCallback((): PendingPayload | null => {
    if (!stage || !normalizedProductId) return null
    return {
      productId: product.id,
      stage,
      product_title: product.title,
      product_handle: product.handle,
      artist_name: artistName,
    }
  }, [stage, normalizedProductId, product.id, product.title, product.handle, artistName])

  const persistWatchlist = useCallback(async () => {
    const p = savePayload()
    if (!p) return
    setBusy(true)
    try {
      const r = await fetch('/api/shop/watchlist', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_product_id: p.productId,
          stage: p.stage,
          product_title: p.product_title,
          product_handle: p.product_handle,
          artist_name: p.artist_name,
        }),
      })
      if (r.ok) setWatching(true)
    } finally {
      setBusy(false)
    }
  }, [savePayload])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !normalizedProductId) return
    try {
      const raw = sessionStorage.getItem(PENDING_KEY)
      if (!raw) return
      const pending = JSON.parse(raw) as PendingPayload
      const pendingNorm = normalizeShopifyProductId(pending.productId)
      if (pendingNorm !== normalizedProductId) return
      sessionStorage.removeItem(PENDING_KEY)
      const aid = normalizeShopifyProductId(pending.productId) || pending.productId
      captureFunnelEvent('watchlist_auth_completed', { artwork_id: aid })
      void (async () => {
        await fetch('/api/shop/watchlist', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shopify_product_id: pending.productId,
            stage: pending.stage,
            product_title: pending.product_title,
            product_handle: pending.product_handle,
            artist_name: pending.artist_name,
          }),
        })
        setWatching(true)
      })()
    } catch {
      sessionStorage.removeItem(PENDING_KEY)
    }
  }, [authLoading, isAuthenticated, normalizedProductId])

  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/experience'

  const label = soldOut
    ? 'Watch for next drop'
    : watching
      ? 'Watching ✓'
      : 'Watch this edition'

  const onWatchClick = async () => {
    if (!stage || busy || !normalizedProductId) return

    captureFunnelEvent('watchlist_clicked', {
      stage,
      auth_state: isAuthenticated ? 'authenticated' : 'anonymous',
    })

    if (watching) {
      setBusy(true)
      try {
        const r = await fetch('/api/shop/watchlist', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopify_product_id: product.id }),
        })
        if (r.ok) setWatching(false)
      } finally {
        setBusy(false)
      }
      return
    }

    if (!isAuthenticated) {
      const p = savePayload()
      if (p) sessionStorage.setItem(PENDING_KEY, JSON.stringify(p))
      setAuthOpen(true)
      return
    }

    await persistWatchlist()
  }

  if (chipOnly || !stage) return null

  return (
    <div className={cn('w-full flex justify-center', compact && 'pt-0.5', className)}>
      <button
        type="button"
        disabled={busy || authLoading}
        onClick={() => void onWatchClick()}
        className={cn(
          'inline-flex items-center justify-center min-h-9 rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.07em]',
          'ring-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBA94]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#141010]',
          'disabled:pointer-events-none disabled:opacity-50',
          !watching &&
            'bg-neutral-900 text-neutral-100 ring-black/20 hover:bg-neutral-800 dark:bg-[#2e2a2a] dark:text-[#f4f0f0] dark:ring-white/12 dark:hover:bg-[#3a3434]',
          watching &&
            'bg-amber-50/90 text-amber-950 ring-amber-800/25 hover:bg-amber-100/90 dark:bg-[#FFBA94]/12 dark:text-[#FFBA94] dark:ring-[#FFBA94]/35 dark:hover:bg-[#FFBA94]/18'
        )}
      >
        {busy ? '…' : label}
      </button>
      <AuthSlideupMenu
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={redirectTo}
        onAuthenticated={async () => {
          const p = savePayload()
          if (!p) return
          const aid = normalizeShopifyProductId(p.productId) || p.productId
          captureFunnelEvent('watchlist_auth_completed', { artwork_id: aid })
          await fetch('/api/shop/watchlist', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              shopify_product_id: p.productId,
              stage: p.stage,
              product_title: p.product_title,
              product_handle: p.product_handle,
              artist_name: p.artist_name,
            }),
          })
          setWatching(true)
          sessionStorage.removeItem(PENDING_KEY)
        }}
      />
    </div>
  )
}
