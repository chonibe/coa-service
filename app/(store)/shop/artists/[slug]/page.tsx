'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getPage, hasPage } from '@/content/shopify-content'
import { AFFILIATE_REF_COOKIE, AFFILIATE_REF_MAX_AGE_DAYS } from '@/lib/affiliate'
import { trackEnhancedEvent, isGAEnabled } from '@/lib/google-analytics'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import { ArtistProfilePageClient } from './ArtistProfilePageClient'

export default function ArtistPage() {
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const [artist, setArtist] = useState<ArtistProfileApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const affiliateLandingFired = useRef(false)
  const [earlyAccessCoupon, setEarlyAccessCoupon] = useState<string | null>(null)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref?.trim() && params?.slug) {
      const maxAge = AFFILIATE_REF_MAX_AGE_DAYS * 24 * 60 * 60
      document.cookie = `${AFFILIATE_REF_COOKIE}=${encodeURIComponent(ref.trim())}; path=/; max-age=${maxAge}; samesite=lax`
      if (isGAEnabled() && !affiliateLandingFired.current) {
        affiliateLandingFired.current = true
        trackEnhancedEvent('affiliate_landing', { affiliate_ref: ref.trim(), page: 'artist', artist_slug: params.slug })
      }
    }
  }, [searchParams, params?.slug])

  useEffect(() => {
    async function fetchEarlyAccessCoupon() {
      const isEarlyAccess = searchParams.get('early_access') === '1' || searchParams.get('unlisted') === '1'
      const token = searchParams.get('token')
      if (isEarlyAccess && params?.slug && token) {
        try {
          const response = await fetch(
            `/api/shop/early-access-coupon?artist=${encodeURIComponent(params.slug)}&token=${encodeURIComponent(token)}`
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
  }, [searchParams, params?.slug])

  useEffect(() => {
    async function fetchArtist() {
      if (!params?.slug) return
      try {
        const response = await fetch(`/api/shop/artists/${params.slug}`)
        if (response.status === 404) {
          setNotFound(true)
          setLoading(false)
          return
        }
        if (response.ok) {
          const data = (await response.json()) as ArtistProfileApiResponse
          let bio = data.bio
          if (!bio && hasPage(params.slug)) {
            const page = getPage(params.slug)
            if (page) {
              bio = page.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
            }
          }
          setArtist({
            ...data,
            bio,
            profile: data.profile ?? {},
            stats: data.stats ?? {
              editionCount: data.products?.length ?? 0,
              remainingCount: 0,
            },
            products: data.products ?? [],
          })
        }
      } catch (error) {
        console.error('Error fetching artist:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchArtist()
  }, [params?.slug])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#171515] text-white">
        <div className="mx-auto max-w-4xl px-6 py-32 animate-pulse space-y-8">
          <div className="h-10 w-48 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded bg-white/5" />
            <div className="space-y-4 pt-8">
              <div className="h-16 w-full rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-3/4 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (notFound || !artist) {
    return (
      <main className="min-h-screen bg-[#171515] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-3xl mb-4">Artist not found</h1>
          <p className="text-white/50 mb-8">We couldn&apos;t find an artist with that name.</p>
          <Link
            href="/shop/explore-artists"
            className="inline-flex items-center gap-2 bg-[#ffba94] text-[#171515] px-6 py-3 text-xs font-medium uppercase tracking-widest"
          >
            View all artists
          </Link>
        </div>
      </main>
    )
  }

  return <ArtistProfilePageClient artist={artist} earlyAccessCoupon={earlyAccessCoupon} />
}
