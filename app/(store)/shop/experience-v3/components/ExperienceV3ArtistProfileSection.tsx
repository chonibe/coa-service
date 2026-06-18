'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'

const ArtistProfilePageClient = dynamic(
  () =>
    import('@/app/(store)/shop/artists/[slug]/ArtistProfilePageClient').then((m) => ({
      default: m.ArtistProfilePageClient,
    })),
  { ssr: false, loading: () => <ArtistProfileEmbeddedSkeleton /> }
)

function ArtistProfileEmbeddedSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border border-white/[0.08] bg-[#171515] p-5 text-left">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="aspect-[4/5] max-h-56 shrink-0 rounded-lg bg-white/10 md:w-2/5" />
        <div className="min-w-0 flex-1 space-y-3 pt-2">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-3 w-full rounded bg-white/[0.06]" />
          <div className="h-3 w-[92%] rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <div className="h-8 w-24 rounded-full bg-white/10" />
        <div className="h-8 w-28 rounded-full bg-white/10" />
      </div>
    </div>
  )
}

export type ExperienceV3ArtistProfileTarget = { slug: string; vendor: string }

export function ExperienceV3ArtistProfileSection({ slug, vendor }: ExperienceV3ArtistProfileTarget) {
  const [artist, setArtist] = useState<ArtistProfileApiResponse | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    setPhase('loading')
    setArtist(null)
  }, [slug])

  useEffect(() => {
    let cancelled = false
    const q = vendor.trim() ? `?vendor=${encodeURIComponent(vendor)}` : ''
    fetch(`/api/shop/artists/${encodeURIComponent(slug)}${q}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: ArtistProfileApiResponse) => {
        if (!cancelled) {
          setArtist(data)
          setPhase('ok')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhase('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [slug, vendor])

  if (phase === 'loading' && !artist) {
    return <ArtistProfileEmbeddedSkeleton />
  }

  if (phase === 'error' || !artist) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#171515]/80 px-5 py-6 text-center text-sm text-white/70">
        <p>Couldn&apos;t load this artist profile in the experience view.</p>
      </div>
    )
  }

  return (
    <div
      data-experience-v3-artist-profile=""
      className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0a0909]"
    >
      <div className="border-b border-white/[0.06] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">Artist profile</p>
      </div>
      <div className="-mx-[1px]">
        <ArtistProfilePageClient artist={artist} embedded />
      </div>
    </div>
  )
}
