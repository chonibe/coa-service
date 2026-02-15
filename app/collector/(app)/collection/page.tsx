'use client'

import { useEffect, useState } from 'react'
import { SubTabBar, type SubTab } from '@/components/app-shell'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Collector Collection Tab — Phase 1.1
//
// YOUR art. The grid of artworks you own.
// Sub-tabs: All / Editions / Series / Artists
// API: /api/collector/dashboard -> extract orders[].order_line_items_v2
// Render: 2-column image grid (Instagram profile-style)
// Tap: Navigate to /collector/artwork/[lineItemId]
// Old source: purchases-section.tsx, artwork-grid.tsx
// ============================================================================

const collectionTabs: SubTab[] = [
  { id: 'grid', label: 'All', href: '/collector/collection' },
  { id: 'editions', label: 'Editions', href: '/collector/collection/editions' },
  { id: 'series', label: 'Series', href: '/collector/collection/series' },
  { id: 'artists', label: 'Artists', href: '/collector/collection/artists' },
]

interface CollectionItem {
  lineItemId: string
  name: string
  imgUrl: string | null
  vendorName: string | null
  nfcClaimedAt: string | null
  productId: string | null
}

interface CollectionStats {
  totalArtworks: number
  authenticated: number
  artistCount: number
}

export default function CollectorCollectionPage() {
  const [items, setItems] = useState<CollectionItem[]>([])
  const [stats, setStats] = useState<CollectionStats>({ totalArtworks: 0, authenticated: 0, artistCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCollection() {
      try {
        const res = await fetch('/api/collector/dashboard')
        const json = await res.json()
        if (json.success) {
          const allItems: CollectionItem[] = []
          const artistSet = new Set<string>()
          let authCount = 0

          for (const order of json.orders || []) {
            for (const item of order.order_line_items_v2 || []) {
              allItems.push({
                lineItemId: item.line_item_id || item.id,
                name: item.name,
                imgUrl: item.img_url || null,
                vendorName: item.vendor_name || null,
                nfcClaimedAt: item.nfc_claimed_at || null,
                productId: item.product_id || null,
              })
              if (item.vendor_name) artistSet.add(item.vendor_name)
              if (item.nfc_claimed_at) authCount++
            }
          }

          setItems(allItems)
          setStats({
            totalArtworks: allItems.length,
            authenticated: authCount,
            artistCount: artistSet.size,
          })
        }
      } catch (err) {
        console.error('[Collection] Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCollection()
  }, [])

  return (
    <div>
      <SubTabBar tabs={collectionTabs} />

      <div className="px-4 py-4">
        {/* Collection stats bar */}
        <div className="flex items-center gap-6 mb-4 text-sm text-gray-500 font-body">
          <span>
            <strong className="text-gray-900">{stats.totalArtworks}</strong> Artworks
          </span>
          <span>
            <strong className="text-gray-900">{stats.authenticated}</strong> Authenticated
          </span>
          <span>
            <strong className="text-gray-900">{stats.artistCount}</strong> Artists
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-gray-100 rounded-impact-block-xs animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400 font-body">
              No artworks in your collection yet.
            </p>
            <p className="text-xs text-gray-400 font-body mt-1">
              Purchase art to start building your collection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {items.map((item) => (
              <Link
                key={item.lineItemId}
                href={`/collector/artwork/${item.lineItemId}`}
                className="group relative"
              >
                <div className="relative aspect-[4/5] bg-gray-100 rounded-impact-block-xs overflow-hidden">
                  {item.imgUrl ? (
                    <Image
                      src={item.imgUrl}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-400 font-body">No image</span>
                    </div>
                  )}
                  {/* Authenticated badge */}
                  {item.nfcClaimedAt && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-impact-success flex items-center justify-center shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] font-body text-gray-700 mt-1.5 truncate">
                  {item.name}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
