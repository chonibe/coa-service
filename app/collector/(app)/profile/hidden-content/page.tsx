'use client'

import { useEffect, useState } from 'react'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { Lock, Sparkles, Gift, Calendar, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Hidden Content — Phase 1.7
//
// API: /api/collector/hidden-content
// Render: Cards with artwork thumbnail, content type icons, unlock status
// Tap: Opens /collector/artwork/[id] to view unlocked content
// Old source: hidden-content.tsx
// ============================================================================

interface HiddenSeries {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string | null
  teaserImageUrl?: string | null
  vendorName: string
  unlockedAt: string
  unlockedVia: {
    artworkId: string
    artworkName: string
    purchaseDate: string
  }
}

interface BonusContent {
  id: number
  benefitType: string
  title: string
  description?: string
  contentUrl?: string
  accessCode?: string
  unlockedAt: string
  unlockedVia: {
    artworkId: string
    artworkName: string
    vendorName: string
    purchaseDate: string
  }
  expiresAt?: string | null
}

interface HiddenContentData {
  hiddenSeries: HiddenSeries[]
  bonusContent: BonusContent[]
}

export default function CollectorHiddenContentPage() {
  const [data, setData] = useState<HiddenContentData>({ hiddenSeries: [], bonusContent: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHiddenContent() {
      try {
        const res = await fetch('/api/collector/hidden-content')
        const json = await res.json()
        if (json.success || json.hiddenSeries || json.bonusContent) {
          setData({
            hiddenSeries: json.hiddenSeries || [],
            bonusContent: json.bonusContent || [],
          })
        }
      } catch (err) {
        console.error('[HiddenContent] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHiddenContent()
  }, [])

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <h1 className="text-lg font-heading font-semibold text-gray-900">Hidden Content</h1>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ContentCard key={i} padding="md">
              <div className="animate-pulse space-y-3">
                <div className="h-32 bg-gray-100 rounded-lg" />
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            </ContentCard>
          ))}
        </div>
      </div>
    )
  }

  const isEmpty = data.hiddenSeries.length === 0 && data.bonusContent.length === 0

  return (
    <div className="px-4 py-4 space-y-6">
      <h1 className="text-lg font-heading font-semibold text-gray-900">Hidden Content</h1>

      {isEmpty ? (
        <div className="text-center py-16">
          <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-body">No hidden content yet</p>
          <p className="text-xs text-gray-400 font-body mt-1">
            Hidden series and bonus content unlocked through your purchases will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Hidden Series */}
          {data.hiddenSeries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h2 className="text-sm font-bold text-gray-900 font-body">
                  Hidden Series ({data.hiddenSeries.length})
                </h2>
              </div>

              {data.hiddenSeries.map((series) => (
                <Link key={series.id} href={`/collector/series/${series.id}`}>
                  <ContentCard padding="none" hoverable>
                    {/* Cover image */}
                    <div className="relative h-36 bg-gray-100">
                      {series.thumbnailUrl ? (
                        <Image
                          src={series.thumbnailUrl}
                          alt={series.name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      ) : series.teaserImageUrl ? (
                        <>
                          <Image
                            src={series.teaserImageUrl}
                            alt={series.name}
                            fill
                            className="object-cover blur-sm"
                            sizes="100vw"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Lock className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                        <Sparkles className="w-3 h-3" /> Hidden
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-gray-900 font-body">{series.name}</p>
                      {series.description && (
                        <p className="text-xs text-gray-500 font-body line-clamp-2 mt-1">{series.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400 font-body">
                        <Calendar className="w-3 h-3" />
                        Unlocked {new Date(series.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <p className="text-[10px] text-gray-400 font-body mt-1">
                        via {series.unlockedVia.artworkName}
                      </p>
                    </div>
                  </ContentCard>
                </Link>
              ))}
            </div>
          )}

          {/* Bonus Content */}
          {data.bonusContent.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 font-body">
                  Bonus Content ({data.bonusContent.length})
                </h2>
              </div>

              {data.bonusContent.map((content) => (
                <ContentCard key={content.id} padding="md" hoverable>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 font-body line-clamp-2">{content.title}</p>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0 capitalize">
                        {content.benefitType}
                      </span>
                    </div>
                    {content.description && (
                      <p className="text-xs text-gray-500 font-body line-clamp-2">{content.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-body">
                      <Calendar className="w-3 h-3" />
                      Unlocked {new Date(content.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <p className="text-[10px] text-gray-400 font-body">
                      via {content.unlockedVia.artworkName} by {content.unlockedVia.vendorName}
                    </p>
                    {content.expiresAt && (
                      <p className="text-[10px] text-amber-600 font-body font-bold">
                        Expires {new Date(content.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      {content.contentUrl && (
                        <a
                          href={content.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-impact-primary text-white text-[10px] font-bold"
                        >
                          <ExternalLink className="w-3 h-3" /> Access Content
                        </a>
                      )}
                      {content.accessCode && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-mono font-bold">
                          Code: {content.accessCode}
                        </span>
                      )}
                    </div>
                  </div>
                </ContentCard>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
