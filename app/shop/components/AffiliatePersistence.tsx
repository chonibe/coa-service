'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getAffiliateArtistSlugFromSearchParams,
  setStoredAffiliateArtist,
} from '@/lib/affiliate-tracking'

/**
 * Persists affiliate/artist from URL (artist, utm_campaign) to sessionStorage
 * so the experience page can pre-select the vendor filter when the user
 * navigates to /experience later in the session.
 */
export function AffiliatePersistence() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const artist = getAffiliateArtistSlugFromSearchParams({
      artist: searchParams.get('artist'),
      utm_campaign: searchParams.get('utm_campaign'),
    })
    if (artist) {
      setStoredAffiliateArtist(artist)
    }
  }, [searchParams])

  return null
}
