'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Pencil, Eye, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Vendor Studio - Artworks — Phase 2.2
//
// API: /api/vendor/products/submissions, /api/vendor/series
// Render: Visual grid of artwork submissions (thumbnail, title, status badge, price)
// Filter tabs: All / Draft / Pending / Published
// Tap artwork: Navigate to /artwork-editor/[productId]
// Tap edit icon: Navigate to /vendor/studio/artworks/[id]/edit
// "+" button: Navigate to /vendor/studio/artworks/new
// Experience chip: /vendor/studio/artworks/[id]/experience (hands off to /artwork-editor/[id])
// Original source (for history): app/vendor/dashboard/products/page.tsx
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
]

interface ArtworkSubmission {
  id: string
  title: string
  status: string
  price: number | null
  imageUrl: string | null
  productId: string | null
  shopifyProductId: string | null
  seriesName?: string | null
  createdAt: string
}

type FilterStatus = 'all' | 'draft' | 'pending' | 'approved' | 'published' | 'rejected'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function VendorStudioPage() {
  const searchParams = useSearchParams()
  const focusId = searchParams?.get('focus') || null
  const focusRef = useRef<HTMLDivElement | null>(null)
  const [submissions, setSubmissions] = useState<ArtworkSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const res = await fetch('/api/vendor/products/submissions', { credentials: 'include' })
        if (res.ok) {
          const json = await res.json()
          setSubmissions(
            (json.submissions || json.products || []).map((s: any) => ({
              id: s.id,
              title: s.title || s.name,
              status: s.status || 'draft',
              price: s.price || s.variants?.[0]?.price || null,
              imageUrl: s.image_url || s.images?.[0]?.src || s.imageUrl || null,
              productId: s.product_id || s.shopify_product_id || s.shopifyProductId || null,
              shopifyProductId: s.shopify_product_id || s.shopifyProductId || null,
              seriesName: s.series_name || s.seriesName || null,
              createdAt: s.created_at || s.createdAt || '',
            }))
          )
        }
      } catch (err) {
        console.error('[Studio] Failed to fetch submissions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSubmissions()
  }, [])

  // Scroll the freshly-submitted artwork into view + flash a ring around it.
  // The fade timer + element existence are both guarded so an unrelated
  // ?focus= query doesn't leave us in a mounted-but-no-target state.
  useEffect(() => {
    if (!focusId || loading) return
    const node = focusRef.current
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, loading, submissions])

  const filtered = filterStatus === 'all'
    ? submissions
    : submissions.filter((s) => s.status === filterStatus)

  const counts = submissions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1
    return acc
  }, {})

  const filters: { value: FilterStatus; label: string; count?: number }[] = [
    { value: 'all', label: 'All', count: submissions.length },
    { value: 'draft', label: 'Draft', count: counts.draft || 0 },
    { value: 'pending', label: 'Pending', count: counts.pending || 0 },
    { value: 'approved', label: 'Approved', count: counts.approved || 0 },
    { value: 'published', label: 'Published', count: counts.published || 0 },
    { value: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
  ]

  return (
    <div>
      <SubTabBar tabs={studioTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Filter pills */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filters.map((f) => {
              const isActive = filterStatus === f.value
              const showCount = f.count !== undefined && f.count > 0
              return (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold font-body shrink-0 transition-all inline-flex items-center gap-1.5',
                    isActive
                      ? 'bg-[#390000] text-[#ffba94]'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <span>{f.label}</span>
                  {showCount && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] tabular-nums',
                        isActive ? 'bg-[#ffba94]/20 text-[#ffba94]' : 'bg-white text-gray-500'
                      )}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Create button */}
          <Link
            href="/vendor/studio/artworks/new"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-impact-primary text-white text-xs font-bold shrink-0"
          >
            <Plus className="w-3 h-3" /> New
          </Link>
        </div>

        {/* Artworks grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto">
            {filterStatus === 'all' ? (
              <>
                <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-3">
                  Your studio is empty
                </p>
                <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
                  Add your first piece.
                </h3>
                <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed mb-6">
                  When you publish an artwork, it appears here with its status and current listing.
                  You can keep drafts private until you&apos;re ready to share.
                </p>
                <Link
                  href="/vendor/studio/artworks/new"
                  className="inline-flex items-center gap-1.5 font-body text-sm font-medium text-[#1a1a1a] underline underline-offset-4"
                >
                  <Plus className="w-4 h-4" /> Add an artwork
                </Link>
              </>
            ) : (
              <p className="font-body text-sm text-[#1a1a1a]/60">
                Nothing marked {filterStatus} right now.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((artwork) => {
              const experienceHref = artwork.productId
                ? `/vendor/studio/artworks/${artwork.productId}/experience`
                : `/vendor/studio/artworks/${artwork.id}/edit`
              const detailsHref = `/vendor/studio/artworks/${artwork.id}/edit`
              const isFocused = focusId === artwork.id
              return (
                <div
                  key={artwork.id}
                  ref={isFocused ? focusRef : undefined}
                  className={cn(
                    'group relative transition-all',
                    isFocused && 'ring-2 ring-impact-primary rounded-impact-block-xs ring-offset-2 ring-offset-white'
                  )}
                >
                  <Link href={experienceHref} aria-label={`Edit experience for ${artwork.title}`}>
                    <div className="relative aspect-[4/5] bg-gray-100 rounded-impact-block-xs overflow-hidden">
                      {artwork.imageUrl ? (
                        <Image
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          fill
                          className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Eye className="w-6 h-6" />
                        </div>
                      )}

                      {/* Status badge */}
                      <span className={cn(
                        'absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                        statusColors[artwork.status] || 'bg-gray-100 text-gray-600'
                      )}>
                        {artwork.status}
                      </span>
                    </div>
                  </Link>

                  <div className="mt-2 space-y-1.5">
                    <div>
                      <p className="text-[12px] font-body text-gray-900 font-medium truncate">{artwork.title}</p>
                      <div className="flex items-center gap-2">
                        {artwork.price != null && (
                          <p className="text-[11px] font-body text-gray-500">${artwork.price.toFixed(2)}</p>
                        )}
                        {artwork.seriesName && (
                          <p className="text-[11px] font-body text-impact-primary truncate">{artwork.seriesName}</p>
                        )}
                      </div>
                    </div>

                    {/* Persistent Experience + Edit actions */}
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={experienceHref}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#1a1a1a] text-white text-[10px] font-body font-semibold hover:opacity-85 transition-opacity"
                        aria-label={`Edit NFC experience for ${artwork.title}`}
                      >
                        <Sparkles className="w-3 h-3" />
                        Experience
                      </Link>
                      <Link
                        href={detailsHref}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[10px] font-body font-semibold hover:bg-gray-200 transition-colors"
                        aria-label={`Edit details for ${artwork.title}`}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
