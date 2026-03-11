'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  getAffiliateArtistSlugFromSearchParams,
  setStoredAffiliateArtist,
  setStoredAffiliateSession,
} from '@/lib/affiliate-tracking'

/**
 * Persists affiliate/artist from URL (artist, utm_campaign) to sessionStorage
 * so the experience page can pre-select the vendor filter when the user
 * navigates to /experience later in the session.
 * Also saves the full affiliate URL and UTM params in session for tracking.
 */
export function AffiliatePersistence() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const artist = getAffiliateArtistSlugFromSearchParams({
      artist: searchParams.get('artist'),
      utm_campaign: searchParams.get('utm_campaign'),
    })
    const utmSource = searchParams.get('utm_source') ?? undefined
    const utmMedium = searchParams.get('utm_medium') ?? undefined
    const utmCampaign = searchParams.get('utm_campaign') ?? undefined
    const utmContent = searchParams.get('utm_content') ?? undefined
    const hasAffiliate = artist || utmSource || utmMedium || utmCampaign || utmContent

    if (artist) {
      setStoredAffiliateArtist(artist)
    }
    if (hasAffiliate && typeof window !== 'undefined') {
      setStoredAffiliateSession({
        landingUrl: window.location.href,
        artist: artist ?? undefined,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        utm_content: utmContent,
      })
    }
  }, [searchParams])

  return null
}
