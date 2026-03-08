'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useShopAuth } from '@/lib/shop/useShopAuth'
import { getAllRatings } from '@/lib/experience-artwork-ratings'

const SYNC_DEBOUNCE_MS = 2000
const SYNC_500_RETRY_MS = 4000

/**
 * Syncs localStorage ratings to the backend when the collector is authenticated.
 * Fires on: auth change, experience-ratings-change event (debounced 2s).
 */
export function useRatingSync() {
  const { user, isAuthenticated } = useShopAuth()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastWarnRef = useRef(0)
  const WARN_THROTTLE_MS = 60000

  const performSync = useCallback(async (isRetry = false) => {
    const ratings = getAllRatings()
    const entries = Object.entries(ratings)
    if (entries.length === 0) return

    try {
      const res = await fetch('/api/collector/ratings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratings: Object.fromEntries(entries) }),
      })
      if (res.ok) return
      const now = Date.now()
      if (now - lastWarnRef.current >= WARN_THROTTLE_MS) {
        lastWarnRef.current = now
        console.warn('[useRatingSync] Sync failed:', res.status)
      }
      if (res.status >= 500 && !isRetry) {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null
          performSync(true)
        }, SYNC_500_RETRY_MS)
      }
    } catch (err) {
      const now = Date.now()
      if (now - lastWarnRef.current >= WARN_THROTTLE_MS) {
        lastWarnRef.current = now
        console.warn('[useRatingSync] Sync error:', err)
      }
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const scheduleSync = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null
        performSync()
      }, SYNC_DEBOUNCE_MS)
    }

    scheduleSync()

    const onRatingsChange = () => scheduleSync()
    window.addEventListener('experience-ratings-change', onRatingsChange)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      window.removeEventListener('experience-ratings-change', onRatingsChange)
    }
  }, [isAuthenticated, user?.id, performSync])
}
