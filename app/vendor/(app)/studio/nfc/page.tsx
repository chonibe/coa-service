'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SubTabBar, type SubTab, ContentCard } from '@/components/app-shell'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

// ============================================================================
// Vendor Studio — NFC tags — Phase 3.9 MVP
//
// API: GET /api/vendor/nfc-tags
// Shows every NFC tag attached to the artist's sold line items, grouped
// by status. Read-only for now — programming/assignment still lives in
// the warehouse admin surface. We expose this because artists kept
// asking "did the NFC tag on order #… get claimed?" and had no surface
// of their own.
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
  { id: 'nfc', label: 'NFC', href: '/vendor/studio/nfc' },
]

interface VendorNfcTag {
  tagId: string
  status: string
  orderId: string | null
  lineItemId: string | null
  artworkName: string | null
  productId: string | null
  programmedAt: string | null
  claimedAt: string | null
  createdAt: string | null
}

type StatusFilter = 'all' | 'unassigned' | 'assigned' | 'programmed' | 'claimed'

const STATUS_META: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  unassigned: {
    label: 'Unassigned',
    tone: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Clock className="w-3 h-3" />,
  },
  assigned: {
    label: 'Assigned',
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  programmed: {
    label: 'Programmed',
    tone: 'bg-blue-50 text-blue-800 border-blue-200',
    icon: <Fingerprint className="w-3 h-3" />,
  },
  claimed: {
    label: 'Claimed',
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function VendorNfcPage() {
  const [tags, setTags] = useState<VendorNfcTag[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [error, setError] = useState<string | null>(null)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vendor/nfc-tags?limit=500', {
        credentials: 'include',
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to load NFC tags')
      }
      const json = await res.json()
      setTags(Array.isArray(json.tags) ? json.tags : [])
    } catch (err: any) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tags.length }
    for (const t of tags) c[t.status] = (c[t.status] || 0) + 1
    return c
  }, [tags])

  const filtered = useMemo(() => {
    if (filter === 'all') return tags
    return tags.filter((t) => t.status === filter)
  }, [tags, filter])

  const filterOrder: StatusFilter[] = ['all', 'unassigned', 'assigned', 'programmed', 'claimed']

  return (
    <>
      <SubTabBar tabs={studioTabs} activeId="nfc" />
      <div className="px-4 py-4 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em]">
              NFC tags
            </h1>
            <p className="font-body text-xs text-[#1a1a1a]/60 mt-0.5">
              Tags attached to your sold editions. Updated live as collectors claim them.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTags}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#1a1a1a]/15 text-[11px] font-bold font-body hover:border-[#1a1a1a]/40 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOrder.map((f) => {
            const isActive = filter === f
            const count = counts[f] || 0
            const label = f === 'all' ? 'All' : STATUS_META[f]?.label || f
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold font-body transition-colors',
                  isActive
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#1a1a1a]/70 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40',
                )}
              >
                <span>{label}</span>
                <span className={cn('tabular-nums', isActive ? 'text-white/70' : 'text-[#1a1a1a]/40')}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {error && (
          <ContentCard padding="md">
            <div className="flex items-start gap-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Couldn&apos;t load NFC tags</p>
                <p className="text-red-700/80 text-xs mt-0.5">{error}</p>
              </div>
            </div>
          </ContentCard>
        )}

        {loading && !error && (
          <ContentCard padding="md">
            <div className="py-6 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          </ContentCard>
        )}

        {!loading && !error && filtered.length === 0 && (
          <ContentCard padding="md">
            <div className="py-10 px-4 text-center">
              <Fingerprint className="w-8 h-8 mx-auto text-gray-300 mb-3" />
              <p className="font-body text-sm text-[#1a1a1a]/70">
                {filter === 'all'
                  ? 'No NFC tags yet. Tags appear here once they\'re attached to sold editions.'
                  : `No tags with status "${STATUS_META[filter]?.label || filter}".`}
              </p>
            </div>
          </ContentCard>
        )}

        {!loading && !error && filtered.length > 0 && (
          <ContentCard padding="sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-body border-separate border-spacing-0">
                <thead>
                  <tr className="text-left text-[#1a1a1a]/50 uppercase text-[10px] tracking-[0.15em]">
                    <th className="px-3 py-2">Tag</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Artwork</th>
                    <th className="px-3 py-2">Order</th>
                    <th className="px-3 py-2">Programmed</th>
                    <th className="px-3 py-2">Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tag) => {
                    const meta = STATUS_META[tag.status] || STATUS_META.unassigned
                    return (
                      <tr key={tag.tagId} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-3 py-2 font-mono text-[11px] text-[#1a1a1a] truncate max-w-[180px]">
                          {tag.tagId}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold',
                              meta.tone,
                            )}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#1a1a1a]">
                          {tag.productId ? (
                            <Link
                              href={`/artwork-editor/${tag.productId}`}
                              className="inline-flex items-center gap-1 hover:underline"
                              title="Open artwork experience"
                            >
                              {tag.artworkName || 'Untitled'}
                              <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                            </Link>
                          ) : (
                            <span className="text-[#1a1a1a]/60">{tag.artworkName || '—'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-[#1a1a1a]/70">
                          {tag.orderId ? `#${tag.orderId}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-[#1a1a1a]/70 tabular-nums">
                          {formatDate(tag.programmedAt)}
                        </td>
                        <td className="px-3 py-2 text-[#1a1a1a]/70 tabular-nums">
                          {formatDate(tag.claimedAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ContentCard>
        )}
      </div>
    </>
  )
}
