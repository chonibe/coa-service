'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { cn } from '@/lib/utils'

export type RosterArtist = {
  handle: string
  name: string
  location?: string
  imageUrl?: string
}

export function CollectorHomeArtistRoster({ artists }: { artists: RosterArtist[] }) {
  const { isAuthenticated, loading } = useShopAuthContext()
  const list = artists.slice(0, 8)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
      {list.map((a, index) => {
        const href = `/shop/artists/${encodeURIComponent(a.handle)}`
        const showFollowing = isAuthenticated && index === 1
        return (
          <div
            key={a.handle}
            className="rounded-xl border border-stone-200/90 bg-white/90 p-3 shadow-sm dark:border-white/10 dark:bg-[#201c1c]/80"
          >
            <Link href={href} className="block text-center">
              <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                {a.imageUrl ? (
                  <Image
                    src={getProxiedImageUrl(a.imageUrl)}
                    alt=""
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-medium text-stone-500">
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-[#FFBA94]">{a.name}</p>
              {a.location ? (
                <p className="text-xs text-stone-500 dark:text-[#FFBA94]/65">{a.location}</p>
              ) : null}
            </Link>
            <div className="mt-2 flex justify-center">
              {loading ? (
                <span className="text-xs text-stone-400">…</span>
              ) : showFollowing ? (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">✓ Following</span>
              ) : (
                <Link
                  href="/shop/account?redirect=/shop/artists"
                  className={cn(
                    'rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-800',
                    'hover:bg-stone-50 dark:border-white/20 dark:text-[#FFBA94] dark:hover:bg-white/5'
                  )}
                >
                  Follow
                </Link>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
