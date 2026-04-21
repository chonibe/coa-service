'use client'

import Image from 'next/image'
import Link from 'next/link'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import exploreStyles from '../explore-artists/explore-artists.module.css'

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
    <div className={exploreStyles.artistsGrid}>
      {list.map((a, index) => {
        const href = `/shop/artists/${encodeURIComponent(a.handle)}`
        const showFollowing = isAuthenticated && index === 1
        return (
          <article key={a.handle} className={exploreStyles.artistCard}>
            <div className={exploreStyles.artistCardInner}>
              <Link href={href} prefetch={false} className={exploreStyles.artistCardMediaButton} aria-label={a.name}>
                <div className={exploreStyles.artistCardMedia}>
                  {a.imageUrl ? (
                    <Image
                      className={exploreStyles.artistCardImg}
                      src={getProxiedImageUrl(a.imageUrl)}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 50vw, 25vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-4xl"
                      style={{
                        background: 'linear-gradient(145deg, #2a1818 0%, #171515 100%)',
                        color: 'var(--peach)',
                        fontFamily: 'var(--font-landing-serif), Georgia, serif',
                      }}
                      aria-hidden
                    >
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={exploreStyles.artistCardOverlay} aria-hidden />
                  <div className={exploreStyles.artistCardInfo}>
                    <div className={exploreStyles.artistCardName}>{a.name}</div>
                    {a.location ? <div className={exploreStyles.artistCardCity}>{a.location}</div> : null}
                  </div>
                </div>
              </Link>
              <div className={exploreStyles.artistCardFooter}>
                <div className={exploreStyles.editionsCount}>
                  {loading ? (
                    <span>…</span>
                  ) : showFollowing ? (
                    <span style={{ color: 'var(--peach)' }}>Following</span>
                  ) : (
                    <Link
                      href="/shop/account?redirect=/shop/street-collector"
                      prefetch={false}
                      style={{
                        color: 'var(--peach)',
                        fontFamily: 'var(--font-landing-mono), monospace',
                        fontSize: 9,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                      }}
                    >
                      Follow
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
