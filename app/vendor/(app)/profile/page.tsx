'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from '@/components/app-shell'
import Link from 'next/link'
import { ChevronRight, Eye, Settings, Pencil, LogOut, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Profile Tab — Phase 2.9
//
// API: /api/vendor/profile, /api/vendor/stats
// Wire: Replace hardcoded "Artist Name" and "—" values with real data
// ============================================================================

const profileLinks = [
  {
    label: 'Edit public profile',
    description: 'Bio, photo, links — how collectors see you',
    href: '/vendor/profile/edit',
    icon: Pencil,
  },
  {
    label: 'Public preview',
    description: 'See what your page looks like to collectors',
    href: '/vendor/profile/public-preview',
    icon: Eye,
  },
  {
    label: 'Account settings',
    description: 'Contact, payouts, tax and compliance',
    href: '/vendor/profile/settings',
    icon: Settings,
  },
  {
    label: 'Sign out',
    description: 'End your session on this device',
    href: '/vendor/signout',
    icon: LogOut,
  },
]

interface VendorProfileData {
  vendorName: string
  bio?: string
  profileImageUrl?: string
  websiteUrl?: string
  instagramHandle?: string
  stats: {
    artworks: number
    sales: number
    collectors: number
  }
}

export default function VendorProfilePage() {
  const [data, setData] = useState<VendorProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
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

        // Fetch stats
        let artworks = 0
        let sales = 0
        let collectors = 0

        try {
          const statsRes = await fetch('/api/vendor/stats', { credentials: 'include' })
          if (statsRes.ok) {
            const statsJson = await statsRes.json()
            artworks = statsJson.totalProducts || statsJson.productCount || 0
            sales = statsJson.totalSales || 0
            collectors = statsJson.totalCollectors || statsJson.collectorCount || 0
          }
        } catch (err) {
          console.error('[VendorProfile] Stats fetch error:', err)
        }

        setData({
          vendorName,
          bio,
          profileImageUrl,
          websiteUrl,
          instagramHandle,
          stats: { artworks, sales, collectors },
        })
      } catch (err) {
        console.error('[VendorProfile] Profile fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <ContentCard padding="lg">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        </ContentCard>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile Hero */}
      <ContentCard padding="lg">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {data?.profileImageUrl ? (
            <img
              src={data.profileImageUrl}
              alt={data.vendorName}
              className="w-20 h-20 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-gray-600 font-body">
                {data?.vendorName?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-heading font-semibold text-gray-900 tracking-tight truncate">
              {data?.vendorName || 'Artist'}
            </h1>
            <p className="text-sm text-gray-500 font-body">Vendor</p>
            {data?.bio && (
              <p className="text-xs text-gray-500 font-body mt-1 line-clamp-2">{data.bio}</p>
            )}
            {(data?.websiteUrl || data?.instagramHandle) && (
              <div className="flex items-center gap-3 mt-2">
                {data.websiteUrl && (
                  <a
                    href={data.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] font-bold text-impact-primary font-body"
                  >
                    <ExternalLink className="w-3 h-3" /> Website
                  </a>
                )}
                {data.instagramHandle && (
                  <a
                    href={`https://instagram.com/${data.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-impact-primary font-body"
                  >
                    @{data.instagramHandle}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Artworks', value: data?.stats.artworks ?? 0 },
            { label: 'Sales', value: data?.stats.sales ?? 0 },
            { label: 'Collectors', value: data?.stats.collectors ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold text-gray-900 font-body">{stat.value}</p>
              <p className="text-[11px] text-gray-500 font-body uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* Profile Links */}
      <ContentCard padding="none">
        {profileLinks.map((link, index) => (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5',
              'hover:bg-gray-50 active:bg-gray-100',
              'transition-colors duration-200',
              index < profileLinks.length - 1 && 'border-b border-gray-50'
            )}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 text-gray-600 shrink-0">
              <link.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 font-body">{link.label}</p>
              <p className="text-xs text-gray-500 font-body">{link.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        ))}
      </ContentCard>
    </div>
  )
}
