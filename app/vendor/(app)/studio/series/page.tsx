'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
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
  Lock,
  ArrowRight,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// ============================================================================
// Vendor Studio — Series index (visual cover-card redesign)
// Maintains: archive, duplicate, preview, Active/Archived filter
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

const unlockTypeConfig: Record<string, {
  label: string
  gradient: string
  icon: typeof Lock
  badgeClass: string
}> = {
  any_purchase: {
    label: 'Open Collection',
    gradient: 'from-blue-500/40 to-cyan-500/40',
    icon: Lock,
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  sequential: {
    label: 'Finish the Set',
    gradient: 'from-purple-500/40 to-pink-500/40',
    icon: ArrowRight,
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  vip: {
    label: 'VIP Unlocks',
    gradient: 'from-orange-500/40 to-red-500/40',
    icon: Crown,
    badgeClass: 'bg-orange-100 text-orange-700',
  },
}

const fallbackGradient: Record<string, string> = {
  any_purchase: 'from-blue-500/20 to-cyan-500/20',
  sequential: 'from-purple-500/20 to-pink-500/20',
  vip: 'from-orange-500/20 to-red-500/20',
  threshold: 'from-orange-500/20 to-red-500/20',
  time_based: 'from-green-500/20 to-emerald-500/20',
  nfc: 'from-indigo-500/20 to-blue-500/20',
}

type Filter = 'active' | 'archived'

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

function SeriesCoverCard({
  series,
  onMenuOpen,
}: {
  series: Series
  onMenuOpen: (id: string) => void
}) {
  const config = unlockTypeConfig[series.unlockType] || {
    label: series.unlockType,
    gradient: fallbackGradient[series.unlockType] || 'from-gray-500/20 to-slate-500/20',
    icon: Lock,
    badgeClass: 'bg-gray-100 text-gray-600',
  }
  const Icon = config.icon
  const isArchived = Boolean(series.archivedAt)
  const gradient = config.gradient

  return (
    <div className="group relative rounded-[10px] overflow-hidden bg-muted aspect-[4/3]">
      {/* Cover image or gradient fallback */}
      {(series.thumbnailUrl || series.coverUrl) ? (
        <Image
          src={series.thumbnailUrl || series.coverUrl!}
          alt={series.name}
          fill
          className={cn(
            'object-cover transition-transform duration-300 group-hover:scale-105',
            isArchived && 'grayscale opacity-60'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
      )}

      {/* Gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Unlock type badge — top left */}
      <div className={cn(
        'absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-sm text-[10px] font-bold',
        config.badgeClass
      )}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>

      {/* Three-dot menu — top right */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMenuOpen(series.id)
        }}
        className={cn(
          'absolute top-3 right-3 z-20 h-8 w-8 rounded-full flex items-center justify-center',
          'bg-black/40 hover:bg-black/60 backdrop-blur-sm border border-white/20',
          'text-white transition-opacity'
        )}
        aria-label="Series options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* "+ Add artwork" button — bottom right */}
      {!isArchived && (
        <Link
          href={`/vendor/studio/artworks/new?series=${series.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute bottom-3 right-3 z-10',
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'bg-impact-primary text-white text-xs font-bold font-body',
            'hover:opacity-85 transition-opacity',
            'shadow-md'
          )}
        >
          <Plus className="w-3 h-3" /> Add artwork
        </Link>
      )}

      {/* Series name overlay — bottom left */}
      <Link
        href={`/vendor/studio/series/${series.id}`}
        className="absolute bottom-0 left-0 right-12 p-3 z-10"
      >
        <p className={cn(
          'font-semibold text-sm text-white drop-shadow-md line-clamp-2',
          isArchived && 'opacity-70'
        )}>
          {series.name}
        </p>
        <p className="text-[10px] text-white/70 mt-0.5">
          {series.memberCount} {series.memberCount === 1 ? 'artwork' : 'artworks'}
        </p>
      </Link>
    </div>
  )
}

function SeriesMenuDropdown({
  series,
  onClose,
  onDuplicate,
  onArchive,
  onUnarchive,
}: {
  series: Series
  onClose: () => void
  onDuplicate: (s: Series) => void
  onArchive: (s: Series) => void
  onUnarchive: (s: Series) => void
}) {
  const isArchived = Boolean(series.archivedAt)
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 z-[60] py-1 text-sm font-body">
        <Link
          href={`/vendor/studio/series/${series.id}`}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
        >
          <Layers className="w-3.5 h-3.5" /> Edit details
        </Link>
        <Link
          href={`/vendor/studio/series/${series.id}/experience`}
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
        >
          <Sparkles className="w-3.5 h-3.5" /> Edit unlock experience
        </Link>
        <a
          href={`/collector/series/${series.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview
        </a>
        <button
          type="button"
          onClick={() => { onDuplicate(series); onClose() }}
          className="flex items-center gap-2 px-3 py-2 text-[#1a1a1a] hover:bg-gray-50 w-full text-left"
        >
          <Copy className="w-3.5 h-3.5" /> Duplicate
        </button>
        <div className="my-1 border-t border-gray-100" />
        {isArchived ? (
          <button
            type="button"
            onClick={() => { onUnarchive(series); onClose() }}
            className="flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 w-full text-left"
          >
            <ArchiveRestore className="w-3.5 h-3.5" /> Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { onArchive(series); onClose() }}
            className="flex items-center gap-2 px-3 py-2 text-amber-700 hover:bg-amber-50 w-full text-left"
          >
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
        )}
      </div>
    </>
  )
}

export default function VendorSeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('active')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<Series | null>(null)
  const [duplicateName, setDuplicateName] = useState('')
  const [duplicating, setDuplicating] = useState(false)
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

  useEffect(() => { fetchSeries() }, [fetchSeries])

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
      if (!res.ok) throw new Error(json.error || 'Failed to duplicate series')
      toast({ title: 'Series duplicated', description: `"${name}" is ready to edit.` })
      setDuplicateTarget(null)
      setDuplicateName('')
      await fetchSeries()
    } catch (err: any) {
      toast({ title: 'Could not duplicate', description: err.message || 'Something went wrong.', variant: 'destructive' })
    } finally {
      setDuplicating(false)
    }
  }

  const handleArchive = async (series: Series) => {
    setOpenMenuId(null)
    try {
      const res = await fetch(`/api/vendor/series/${series.id}/archive`, { method: 'POST', credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to archive')
      toast({ title: 'Series archived', description: `"${series.name}" is now in your archive.` })
      await fetchSeries()
    } catch (err: any) {
      toast({ title: 'Could not archive', description: err.message || 'Something went wrong.', variant: 'destructive' })
    }
  }

  const handleUnarchive = async (series: Series) => {
    setOpenMenuId(null)
    try {
      const res = await fetch(`/api/vendor/series/${series.id}/unarchive`, { method: 'POST', credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to restore')
      toast({ title: 'Series restored', description: `"${series.name}" is back in your active library.` })
      await fetchSeries()
    } catch (err: any) {
      toast({ title: 'Could not restore', description: err.message || 'Something went wrong.', variant: 'destructive' })
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
          /* Loading skeletons */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-[10px] bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : visibleSeries.length === 0 && filter === 'archived' ? (
          /* Archived empty state */
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <Archive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-2">No archived series</p>
            <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed">
              Archive a series from its menu to keep your active library focused.
            </p>
          </div>
        ) : visibleSeries.length === 0 ? (
          /* Active empty state */
          <div className="text-center py-16 px-4 max-w-md mx-auto">
            <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-body text-xs tracking-[0.2em] uppercase text-[#1a1a1a]/50 mb-3">No series yet</p>
            <h3 className="font-heading text-2xl font-semibold text-[#1a1a1a] tracking-[-0.01em] mb-3">
              Create your first series
            </h3>
            <p className="font-body text-sm text-[#1a1a1a]/60 leading-relaxed mb-8">
              Group your artworks into a curated collection. Each series holds the unlock experience your collectors receive when they scan the NFC chip.
            </p>
            <Link
              href="/vendor/studio/series/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-impact-primary text-white text-sm font-body font-bold hover:opacity-85 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Create series
            </Link>
          </div>
        ) : (
          /* Visual cover-card grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {visibleSeries.map((series) => (
              <div key={series.id} className="relative">
                <SeriesCoverCard
                  series={series}
                  onMenuOpen={(id) => setOpenMenuId(id === openMenuId ? null : id)}
                />
                {openMenuId === series.id && (
                  <SeriesMenuDropdown
                    series={series}
                    onClose={() => setOpenMenuId(null)}
                    onDuplicate={startDuplicate}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                  />
                )}
              </div>
            ))}

            {/* "+ New series" card — only in active filter */}
            {filter === 'active' && (
              <Link
                href="/vendor/studio/series/new"
                className={cn(
                  'aspect-[4/3] rounded-[10px] border-2 border-dashed',
                  'border-[#1a1a1a]/20 hover:border-[#1a1a1a]/50',
                  'flex flex-col items-center justify-center gap-2',
                  'text-[#1a1a1a]/50 hover:text-[#1a1a1a]/80',
                  'transition-colors cursor-pointer'
                )}
              >
                <div className="h-10 w-10 rounded-full border-2 border-current flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold font-body">New series</p>
              </Link>
            )}
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
                <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/50">Duplicate series</p>
                <h3 className="font-heading text-lg font-semibold text-[#1a1a1a] mt-1">Name your copy</h3>
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
              <span className="font-semibold"> {duplicateTarget.name}</span>. The new series starts empty of orders.
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