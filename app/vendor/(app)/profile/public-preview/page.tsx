'use client'

import { useEffect, useState } from 'react'
import { ContentCard, ContentCardHeader } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Globe, Instagram } from 'lucide-react'

// ============================================================================
// Vendor Public Preview — Phase 3.1
//
// Preview of public artist page as collectors see it.
// ============================================================================

interface PublicProfile {
  vendorName: string
  bio?: string
  profileImageUrl?: string
  websiteUrl?: string
  instagramHandle?: string
  artworks: Array<{
    id: string
    title: string
    imageUrl?: string
    handle?: string
    price?: number
  }>
  series: Array<{
    id: string
    name: string
    thumbnailUrl?: string
    artworkCount: number
  }>
}

export default function VendorPublicPreviewPage() {
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPreview() {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/vendor/profile', { credentials: 'include' })
        let vendorName = 'Artist'
        let bio = ''
        let profileImageUrl = ''
        let websiteUrl = ''
        let instagramHandle = ''

        if (profileRes.ok) {
          const profileJson = await profileRes.json()
          const v = profileJson.vendor || {}
          vendorName = v.vendor_name || v.name || 'Artist'
          bio = v.bio || ''
          profileImageUrl = v.profile_image_url || v.profileImageUrl || ''
          websiteUrl = v.website_url || v.websiteUrl || ''
          instagramHandle = v.instagram_handle || v.instagramHandle || ''
        }

        // Fetch artworks
        let artworks: any[] = []
        try {
          const artRes = await fetch('/api/vendor/products/submissions', { credentials: 'include' })
          if (artRes.ok) {
            const artJson = await artRes.json()
            artworks = (artJson.submissions || artJson.products || [])
              .filter((s: any) => s.status === 'published' || s.status === 'approved')
              .map((s: any) => ({
                id: s.id,
                title: s.title || s.name,
                imageUrl: s.image_url || s.images?.[0]?.src || s.imageUrl || null,
                handle: s.handle,
                price: s.price || s.variants?.[0]?.price || null,
              }))
          }
        } catch (err) {
          console.error('[PublicPreview] Artworks fetch error:', err)
        }

        // Fetch series
        let series: any[] = []
        try {
          const serRes = await fetch('/api/vendor/series', { credentials: 'include' })
          if (serRes.ok) {
            const serJson = await serRes.json()
            series = (serJson.series || [])
              .filter((s: any) => s.is_active !== false && !s.is_private)
              .map((s: any) => ({
                id: s.id,
                name: s.name || s.title,
                thumbnailUrl: s.thumbnail_url || s.thumbnailUrl || null,
                artworkCount: s.member_count || s.memberCount || 0,
              }))
          }
        } catch (err) {
          console.error('[PublicPreview] Series fetch error:', err)
        }

        setProfile({ vendorName, bio, profileImageUrl, websiteUrl, instagramHandle, artworks, series })
      } catch (err) {
        console.error('[PublicPreview] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPreview()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <div className="text-center py-16 animate-pulse">
          <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto" />
          <div className="h-5 bg-gray-200 rounded w-32 mx-auto mt-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Preview banner */}
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-impact-block-sm text-xs font-body text-amber-700">
        <span className="font-bold">Preview Mode</span> — This is how collectors see your profile
      </div>

      {/* Profile header */}
      <div className="text-center">
        {profile?.profileImageUrl ? (
          <img
            src={profile.profileImageUrl}
            alt={profile.vendorName}
            className="w-24 h-24 rounded-full object-cover mx-auto"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center mx-auto">
            <span className="text-3xl font-bold text-gray-500">
              {profile?.vendorName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
        <h1 className="text-xl font-heading font-bold text-gray-900 mt-3">
          {profile?.vendorName}
        </h1>
        {profile?.bio && (
          <p className="text-sm text-gray-500 font-body mt-2 max-w-sm mx-auto">{profile.bio}</p>
        )}
        <div className="flex items-center justify-center gap-4 mt-3">
          {profile?.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-impact-primary font-body"
            >
              <Globe className="w-3 h-3" /> Website
            </a>
          )}
          {profile?.instagramHandle && (
            <a
              href={`https://instagram.com/${profile.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-impact-primary font-body"
            >
              <Instagram className="w-3 h-3" /> @{profile.instagramHandle}
            </a>
          )}
        </div>
      </div>

      {/* Artworks grid */}
      {profile && profile.artworks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 font-body">Artworks ({profile.artworks.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {profile.artworks.map((artwork) => (
              <div key={artwork.id} className="group">
                <div className="relative aspect-[4/5] bg-gray-100 rounded-impact-block-xs overflow-hidden">
                  {artwork.imageUrl ? (
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-body text-gray-700 mt-1.5 truncate">{artwork.title}</p>
                {artwork.price != null && (
                  <p className="text-[10px] font-body text-gray-500">${artwork.price.toFixed(2)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Public series */}
      {profile && profile.series.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-900 font-body">Series ({profile.series.length})</h2>
          <div className="space-y-3">
            {profile.series.map((series) => (
              <ContentCard key={series.id} padding="md">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {series.thumbnailUrl ? (
                      <Image src={series.thumbnailUrl} alt={series.name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 font-body">{series.name}</p>
                    <p className="text-xs text-gray-500 font-body">{series.artworkCount} artworks</p>
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
