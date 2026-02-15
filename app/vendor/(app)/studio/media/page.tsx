'use client'

import { useEffect, useState, useMemo } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import { ContentCard } from '@/components/app-shell'
import Image from 'next/image'
import { Upload, ImageIcon, Video, Music, FileText, Search, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function VendorMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchMedia() {
      try {
        const params = new URLSearchParams()
        if (filter !== 'all') params.set('type', filter)
        if (searchQuery) params.set('search', searchQuery)
        params.set('sort', 'newest')

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
    fetchMedia()
  }, [filter, searchQuery])

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
        {/* Search + Upload */}
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
          <a
            href="/vendor/dashboard/media-library?upload=true"
            className="flex items-center gap-1 px-3 py-2 rounded-impact-block-sm bg-impact-primary text-white text-xs font-bold shrink-0"
          >
            <Upload className="w-3 h-3" /> Upload
          </a>
        </div>

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
            <p className="text-xs text-gray-400 font-body mt-1">Upload images, videos, or audio to your library.</p>
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
