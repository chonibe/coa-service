'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus,
  Layers,
  Sparkles,
  MoreVertical,
  Copy,
  Archive,
  ArchiveRestore,
  ExternalLink,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// Vendor Studio - Series — Phase 2b (archive + duplicate + preview)
//
// API:
//   GET    /api/vendor/series?include_archived=true
//   POST   /api/vendor/series/[id]/duplicate
//   POST   /api/vendor/series/[id]/archive
//   POST   /api/vendor/series/[id]/unarchive
// Render: Active | Archived filter pills with counts. Per-row kebab menu
//   exposes Edit, Edit unlock experience, Preview (collector view in a
//   new tab), Duplicate, Archive/Unarchive.
// Original source (for history): app/vendor/dashboard/series/page.tsx
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
  { id: 'nfc', label: 'NFC', href: '/vendor/studio/nfc' },
]

interface Series {
  id: string
  name: string
  description?: string
  thumbnailUrl?: string | null
  coverUrl?: string | null
  unlockType: string
  memberCount: number
  isActive: boolean
  isPrivate: boolean
  archivedAt: string | null
  createdAt: string
}

const unlockTypeLabels: Record<string, string> = {
  any_purchase: 'Any Purchase',
  all_purchases: 'Collect All',
  sequential: 'Sequential',
  milestone: 'Milestone',
  threshold: 'Threshold',
  vip: 'VIP',
  time_based: 'Time-based',
}

const unlockTypeColors: Record<string, string> = {
  any_purchase: 'bg-green-100 text-green-700',
  all_purchases: 'bg-blue-100 text-blue-700',
  sequential: 'bg-purple-100 text-purple-700',
  milestone: 'bg-amber-100 text-amber-700',
  threshold: 'bg-orange-100 text-orange-700',
  vip: 'bg-pink-100 text-pink-700',
  time_based: 'bg-indigo-100 text-indigo-700',
}

type Filter = 'active' | 'archived'

function formatRelative(iso: string | null): string {
  if (!iso) return ''
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const month = Math.floor(day / 30)
  if (month < 12) return `${month}mo ago`
  return `${Math.floor(month / 12)}y ago`
}

function mapSeries(raw: any): Series {
  return {
    id: raw.id,
    name: raw.name || raw.title,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url || raw.thumbnailUrl || raw.cover_url || null,
    coverUrl: raw.cover_url || raw.coverUrl || null,
    unlockType: raw.unlock_type || raw.unlockType || 'any_purchase',
    memberCount: raw.member_count || raw.memberCount || raw.artworks?.length || 0,
    isActive: raw.is_active !== false,
    isPrivate: raw.is_private || false,
    archivedAt: raw.archived_at ?? raw.archivedAt ?? null,
    createdAt: raw.created_at || raw.createdAt || '',
  }
}

export default function VendorSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('active')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<Series | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicating, setDuplicating] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSeries = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor/series?include_archived=true', {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setSeriesList((json.series || []).map(mapSeries))
      }
    } catch (err) {
      console.error('[Series] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSeries()
  }, [fetchSeries])

  // Close kebab menus when clicking elsewhere on the page.
  useEffect(() => {
    if (!openMenuId) return
    const handle = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-series-menu]')) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [openMenuId])

  const counts = useMemo(() => {
    const active = seriesList.filter((s) => !s.archivedAt && s.isActive).length
    const archived = seriesList.filter((s) => s.archivedAt).length
    return { active, archived }
  }, [seriesList])

  const visibleSeries = useMemo(() => {
    if (filter === 'archived') return seriesList.filter((s) => s.archivedAt)
    return seriesList.filter((s) => !s.archivedAt && s.isActive)
  }, [seriesList, filter])

  const startDuplicate = (series: Series) => {
    setDuplicateTarget(series)
    setDuplicateName(`${series.name} copy`)
    setOpenMenuId(null)
  }

  const submitDuplicate = async () => {
    if (!duplicateTarget) return
    const name = duplicateName.trim()
    if (!name) {
      toast({ title: 'Name required', description: 'Give the duplicate a name.', variant: 'destructive' })
      return
    }
    setDuplicating(true)
    try {
      const res = await fetch(`/api/vendor/series/${duplicateTarget.id}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: name }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error || 'Failed to duplicate series')
      }
      toast({
        title: 'Series duplicated',
        description: `“${name}” is ready to edit.`,
      })
      setDuplicateTarget(null)
      setDuplicateName('')
      await fetchSeries()
    } catch (err: any) {
      toast({
        title: 'Could not duplicate',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setDuplicating(false)
    }
  }

  const handleArchive = async (series: Series) => {
    setArchivingId(series.id)
    setOpenMenuId(null)
    try {
      const res = await fetch(`/api/vendor/series/${series.id}/archive`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to archive')
      toast({
        title: 'Series archived',
        description: `“${series.name}” is now in your archive.`,
      })
      await fetchSeries()
    } catch (err: any) {
      toast({
        title: 'Could not archive',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setArchivingId(null)
    }
  }

  const handleUnarchive = async (series: Series) => {
    setArchivingId(series.id)
    setOpenMenuId(null)
    try {
      const res = await fetch(`/api/vendor/series/${series.id}/unarchive`, {
        method: 'POST',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to restore')
      toast({
        title: 'Series restored',
        description: `“${series.name}” is back in your active library.`,
      })
      await fetchSeries()
    } catch (err: any) {
      toast({
        title: 'Could not restore',
        description: err.message || 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div>
      <SubTabBar tabs={studioTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Filter + create row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['active', 'archived'] as Filter[]).map((f) => {
              const isActive = filter === f
              const count = f === 'active' ? counts.active : counts.archived
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold font-body transition-colors',
                    isActive
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-white text-[#1a1a1a]/70 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/40'
                  )}
                >
                  <span className="capitalize">{f}</span>
                  <span className={cn('tabular-nums', isActive ? 'text-white/70' : 'text-[#1a1a1a]/40')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <Link
            href="/vendor/studio/series/new"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-impact-primary text-white text-xs font-bold"
          >
            <Plus className="w-3 h-3" /> Create Series
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ContentCard key={i} padding="md">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-20 h-20 rounded-lg bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        ) : visibleSeries.length === 0 ? (
          filter === 'archived' ? (
            <div className="text-center py-16 px-4 max-w-md mx-auto">
              <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">
                No archived series
              </p>
              <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed">
                Archive a series from its menu to keep your active library focused. Anything you
                archive lands here and can be restored at any time.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 px-4 max-w-md mx-auto">
              <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">
                No series yet
              </p>
              <h3 className="font-heading text-xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
                Group your artworks into a series.
              </h3>
              <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed mb-6">
                Series hold the unlock experience your collectors receive when they scan the NFC
                chip — a shared template across every artwork in the collection.
              </p>
              <Link
                href="/vendor/studio/series/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-impact-primary text-white text-sm font-body font-semibold hover:opacity-85 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Create series
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-3">
            {visibleSeries.map((series) => {
              const isArchived = Boolean(series.archivedAt)
              const isBusy = archivingId === series.id
              return (
                <ContentCard key={series.id} padding="md" hoverable>
                  <div className="flex items-start gap-4">
                    {/* Cover art */}
                    <Link
                      href={`/vendor/studio/series/${series.id}`}
                      className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                    >
                      {(series.thumbnailUrl || series.coverUrl) ? (
                        <Image
                          src={series.thumbnailUrl || series.coverUrl!}
                          alt={series.name}
                          fill
                          className={cn('object-cover', isArchived && 'grayscale opacity-60')}
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Layers className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/vendor/studio/series/${series.id}`} className="min-w-0">
                          <p className={cn(
                            'text-sm font-semibold font-body truncate hover:text-impact-primary transition-colors',
                            isArchived ? 'text-[#1a1a1a]/60' : 'text-gray-900'
                          )}>
                            {series.name}
                          </p>
                        </Link>

                        {/* Kebab menu */}
                        <div className="relative shrink-0" data-series-menu>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setOpenMenuId(openMenuId === series.id ? null : series.id)
                            }}
                            disabled={isBusy}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                            aria-label="Series options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === series.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-md shadow-lg border border-gray-200 z-20 py-1 text-sm font-body">
                              <Link
                                href={`/vendor/studio/series/${series.id}`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
                              >
                                <Layers className="w-3.5 h-3.5" /> Edit details
                              </Link>
                              <Link
                                href={`/vendor/studio/series/${series.id}/experience`}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Edit unlock experience
                              </Link>
                              <a
                                href={`/collector/series/${series.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Preview
                              </a>
                              <button
                                type="button"
                                onClick={() => startDuplicate(series)}
                                className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50 w-full text-left"
                              >
                                <Copy className="w-3.5 h-3.5" /> Duplicate
                              </button>
                              <div className="my-1 border-t border-gray-100" />
                              {isArchived ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnarchive(series)}
                                  className="flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 w-full text-left"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleArchive(series)}
                                  className="flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 w-full text-left"
                                >
                                  <Archive className="w-3.5 h-3.5" /> Archive
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {series.description && (
                        <p className="text-xs text-gray-500 font-body line-clamp-1 mt-0.5">{series.description}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold',
                          unlockTypeColors[series.unlockType] || 'bg-gray-100 text-gray-600'
                        )}>
                          {unlockTypeLabels[series.unlockType] || series.unlockType}
                        </span>
                        <span className="text-[10px] text-gray-500 font-body">
                          {series.memberCount} {series.memberCount === 1 ? 'artwork' : 'artworks'}
                        </span>
                        {series.isPrivate && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                            Hidden
                          </span>
                        )}
                        {isArchived && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            Archived {formatRelative(series.archivedAt)}
                          </span>
                        )}
                      </div>

                      {/* Action links — keep the two most common actions inline so they don't hide behind the menu. */}
                      {!isArchived && (
                        <div className="flex items-center gap-3 mt-2">
                          <Link
                            href={`/vendor/studio/series/${series.id}`}
                            className="text-[10px] font-bold text-impact-primary font-body"
                          >
                            Edit Series
                          </Link>
                          <Link
                            href={`/vendor/studio/series/${series.id}/experience`}
                            className="flex items-center gap-0.5 text-[10px] font-bold text-gray-500 font-body hover:text-impact-primary transition-colors"
                          >
                            <Sparkles className="w-3 h-3" /> Edit unlock experience
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </ContentCard>
              )
            })}
          </div>
        )}
      </div>

      {/* Duplicate dialog */}
      {duplicateTarget && (
        <div
          className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !duplicating) setDuplicateTarget(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">
                  Duplicate series
                </p>
                <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] mt-1">
                  Name your copy
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !duplicating && setDuplicateTarget(null)}
                className="p-1 -mr-1 rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-[#1a1a1a]/60 font-body">
              We&apos;ll copy the unlock template and member list from
              <span className="font-semibold"> {duplicateTarget.name}</span>. The new series starts
              empty of orders and ready to edit.
            </p>
            <input
              type="text"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              disabled={duplicating}
              placeholder="New series name"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-body focus:border-impact-primary focus:outline-none disabled:opacity-50"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDuplicateTarget(null)}
                disabled={duplicating}
                className="px-3 py-1.5 text-xs font-bold font-body text-[#1a1a1a]/60 hover:text-[#1a1a1a] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDuplicate}
                disabled={duplicating || !duplicateName.trim()}
                className="px-3 py-1.5 text-xs font-bold font-body bg-impact-primary text-white rounded-full disabled:opacity-50"
              >
                {duplicating ? 'Duplicating…' : 'Create copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
