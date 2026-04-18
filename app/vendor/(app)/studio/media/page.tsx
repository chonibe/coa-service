'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import Image from 'next/image'
import { Upload, ImageIcon, Video, Music, FileText, Search, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

// ============================================================================
// Vendor Studio - Media — Phase 2.4
//
// API: /api/vendor/media-library?type=&search=&sort=
// Render: Media grid with type filter pills (all/image/video/audio/pdf), upload button
// Old source: app/vendor/dashboard/media-library/page.tsx
// ============================================================================

const studioTabs: SubTab[] = [
  { id: 'artworks', label: 'Artworks', href: '/vendor/studio' },
  { id: 'series', label: 'Series', href: '/vendor/studio/series' },
  { id: 'media', label: 'Media', href: '/vendor/studio/media' },
  { id: 'nfc', label: 'NFC', href: '/vendor/studio/nfc' },
]

interface MediaItem {
  id: string
  url: string
  fileName: string
  fileType: string
  fileSize: number
  mimeType: string
  thumbnailUrl?: string | null
  createdAt: string
}

type MediaFilter = 'all' | 'image' | 'video' | 'audio' | 'pdf'

const filterIcons: Record<MediaFilter, React.ReactNode> = {
  all: null,
  image: <ImageIcon className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  audio: <Music className="w-3 h-3" />,
  pdf: <FileText className="w-3 h-3" />,
}

function getMediaType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  return 'other'
}

function getMediaIcon(type: string) {
  switch (type) {
    case 'image': return <ImageIcon className="w-8 h-8 text-gray-300" />
    case 'video': return <Video className="w-8 h-8 text-blue-300" />
    case 'audio': return <Music className="w-8 h-8 text-purple-300" />
    case 'pdf': return <FileText className="w-8 h-8 text-red-300" />
    default: return <FileText className="w-8 h-8 text-gray-300" />
  }
}

interface UploadingFile {
  id: string
  name: string
  progress: 'uploading' | 'done' | 'error'
  error?: string
}

export default function VendorMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { toast } = useToast()

  async function fetchMedia() {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('type', filter)
      if (searchQuery) params.set('search', searchQuery)
      params.set('sort', 'date_desc')

      const res = await fetch(`/api/vendor/media-library?${params.toString()}`, { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setMediaItems(
          (json.media || json.files || []).map((m: any) => ({
            id: m.id,
            url: m.url || m.file_url,
            fileName: m.file_name || m.fileName || m.name || 'Untitled',
            fileType: m.file_type || m.fileType || getMediaType(m.mime_type || m.mimeType || ''),
            fileSize: m.file_size || m.fileSize || 0,
            mimeType: m.mime_type || m.mimeType || '',
            thumbnailUrl: m.thumbnail_url || m.thumbnailUrl || null,
            createdAt: m.created_at || m.createdAt || '',
          }))
        )
      }
    } catch (err) {
      console.error('[Media] Failed to fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery])

  // Inline upload handler. Posts each file to the existing
  // /api/vendor/media-library/upload endpoint and refreshes the grid on
  // completion. Kept as a simple sequential loop to preserve the calm
  // single-surface UX (no modal, no separate page).
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const incoming: UploadingFile[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: f.name,
      progress: 'uploading',
    }))
    setUploading((prev) => [...prev, ...incoming])

    let successCount = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const entryId = incoming[i].id
      try {
        let type: 'image' | 'video' | 'audio' | 'pdf' = 'image'
        if (file.type.startsWith('video/')) type = 'video'
        else if (file.type.startsWith('audio/')) type = 'audio'
        else if (file.type === 'application/pdf') type = 'pdf'

        const fd = new FormData()
        fd.append('file', file)
        fd.append('type', type)

        const res = await fetch('/api/vendor/media-library/upload', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j.error || `Upload failed (${res.status})`)
        }
        successCount += 1
        setUploading((prev) => prev.map((u) => (u.id === entryId ? { ...u, progress: 'done' } : u)))
      } catch (err: any) {
        setUploading((prev) =>
          prev.map((u) => (u.id === entryId ? { ...u, progress: 'error', error: err?.message || 'Upload failed' } : u))
        )
      }
    }

    if (successCount > 0) {
      toast({ title: `Uploaded ${successCount} file${successCount === 1 ? '' : 's'}` })
      await fetchMedia()
    }

    // Clear successful entries after a moment so the list doesn't balloon.
    setTimeout(() => {
      setUploading((prev) => prev.filter((u) => u.progress !== 'done'))
    }, 2500)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const filters: { value: MediaFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'pdf', label: 'PDFs' },
  ]

  return (
    <div>
      <SubTabBar tabs={studioTabs} />

      <div className="px-4 py-4 space-y-4">
        {/* Search + inline Upload */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-impact-block-sm text-sm font-body text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-impact-primary/20"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-2 rounded-impact-block-sm bg-impact-primary text-white text-xs font-bold shrink-0 hover:opacity-90 transition-opacity"
            aria-label="Upload media files"
          >
            <Upload className="w-3 h-3" /> Upload
          </button>
        </div>

        {/* Upload progress rail */}
        {uploading.length > 0 && (
          <div className="space-y-1">
            {uploading.map((u) => (
              <div
                key={u.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-impact-block-sm text-xs font-body',
                  u.progress === 'error' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                )}
              >
                {u.progress === 'uploading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {u.progress === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                {u.progress === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
                <span className="truncate flex-1">{u.name}</span>
                {u.progress === 'error' && u.error && (
                  <span className="text-[10px] shrink-0">{u.error}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold font-body shrink-0 transition-all',
                filter === f.value
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {filterIcons[f.value]}
              {f.label}
            </button>
          ))}
        </div>

        {/* Media grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="text-center py-16">
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No media files</p>
            <p className="text-xs text-gray-400 font-body mt-1">Upload images, videos, audio, or PDFs to your library.</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-1 px-4 py-2 rounded-impact-block-sm bg-impact-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <Upload className="w-3 h-3" /> Upload your first file
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {mediaItems.map((item) => {
              const type = item.fileType || getMediaType(item.mimeType)
              const isImage = type === 'image'

              return (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                >
                  {isImage && (item.thumbnailUrl || item.url) ? (
                    <Image
                      src={item.thumbnailUrl || item.url}
                      alt={item.fileName}
                      fill
                      className="object-cover"
                      sizes="33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {getMediaIcon(type)}
                      <p className="text-[9px] text-gray-400 font-body mt-1 truncate max-w-[80%]">{item.fileName}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
