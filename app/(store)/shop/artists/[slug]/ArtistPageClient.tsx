'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { AFFILIATE_REF_COOKIE, AFFILIATE_REF_MAX_AGE_DAYS } from '@/lib/affiliate'
import { trackEnhancedEvent, isGAEnabled } from '@/lib/google-analytics'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import { ArtistProfilePageClient } from './ArtistProfilePageClient'

type Props = {
  artist: ArtistProfileApiResponse
  slug: string
}

/**
 * Client shell: affiliate cookie, early-access coupon fetch. Artist data comes from the server page.
 */
export function ArtistPageClient({ artist, slug }: Props) {
  const searchParams = useSearchParams()
  const affiliateLandingFired = useRef(false)
  const [earlyAccessCoupon, setEarlyAccessCoupon] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref?.trim() && slug) {
      const maxAge = AFFILIATE_REF_MAX_AGE_DAYS * 24 * 60 * 60
      document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(ref.trim())}; path=/; max-age=${maxAge}; samesite=lax`
      if (isGAEnabled() && !affiliateLandingFired.current) {
        affiliateLandingFired.current = true
        trackEnhancedEvent('affiliate_landing', { affiliate_ref: ref.trim(), page: 'artist', artist_slug: slug })
      }
    }
  }, [searchParams, slug])

  useEffect(() => {
    async function fetchEarlyAccessCoupon() {
      const isEarlyAccess = searchParams.get('early_access') === '1' || searchParams.get('unlisted') === '1'
      const token = searchParams.get('token')
      if (isEarlyAccess && slug && token) {
        try {
          const response = await fetch(
            `/api/shop/early-access-coupon?artist=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`
          )
          if (response.ok) {
            const data = await response.json()
            setEarlyAccessCoupon(data.couponCode)
          }
        } catch {
          /* ignore */
        }
      }
    }
    fetchEarlyAccessCoupon()
  }, [searchParams, slug])

  return <ArtistProfilePageClient artist={artist} earlyAccessCoupon={earlyAccessCoupon} />
}
