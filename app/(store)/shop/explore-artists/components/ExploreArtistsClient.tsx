'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import type { ExploreArtistRow } from '@/lib/shop/explore-artists-order'
import landingStyles from '../../home-v2/landing.module.css'
import exploreStyles from '../explore-artists.module.css'
import { useLandingScrollReveal } from '../../home-v2/hooks/useLandingScrollReveal'

function shortBio(s: string | undefined, max = 96): string | undefined {
  if (!s) return undefined
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

type Props = {
  artists: ExploreArtistRow[]
  experienceUrl: string
}

/** Wide tile indices for editorial rhythm (desktop). */
const WIDE_INDEXES = new Set([0, 5, 12])

export function ExploreArtistsClient({ artists, experienceUrl }: Props) {
  const heroReveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const gridReveal = useLandingScrollReveal({
    rootMargin: '0px 0px -12% 0px',
    mode: 'stagger',
  })

  return (
    <>
      <div className={exploreStyles.main}>
        <header ref={heroReveal.ref} className={cn(exploreStyles.hero, heroReveal.className)}>
          <p className={exploreStyles.heroEyebrow}>The collection</p>
          <h1 className={exploreStyles.heroTitle}>
            Explore <em>the artists</em>
          </h1>
          <p className={exploreStyles.heroLead}>
            You want art that feels personal — not mass-produced. Browse independent creators from dozens of
            cities, read their stories, then pick prints that belong on your wall.
          </p>
          <ol className={exploreStyles.planRow}>
            <li>
              <strong>1</strong> — Find a voice you connect with
            </li>
            <li>
              <strong>2</strong> — Open their profile
            </li>
            <li>
              <strong>3</strong> — Build your lamp in the shop
            </li>
          </ol>
          <div className={exploreStyles.statStrip}>
            <div>
              <div className={exploreStyles.statN}>{artists.length}</div>
              <div className={exploreStyles.statL}>Artists in catalog</div>
            </div>
            <div>
              <div className={exploreStyles.statN}>40+</div>
              <div className={exploreStyles.statL}>Countries represented</div>
            </div>
          </div>
        </header>

        <section ref={gridReveal.ref} className={cn(gridReveal.className)}>
          <h2 className="sr-only">Artists</h2>
          <ul className={exploreStyles.grid}>
            {artists.map((artist, idx) => {
              const wide = WIDE_INDEXES.has(idx)
              const bio = shortBio(artist.bio)
              return (
                <li
                  key={artist.slug}
                  className={cn(landingStyles.landingStagger, wide && exploreStyles.cardWide)}
                  style={{ ['--stagger' as string]: idx % 12 }}
                >
                  <Link href={`/shop/artists/${artist.slug}`} className={exploreStyles.card}>
                    <div className={exploreStyles.cardMedia}>
                      {artist.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- proxied CDN; matches artists listing
                        <img
                          src={getProxiedImageUrl(artist.image)}
                          alt={artist.name}
                          loading={idx < 8 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-4xl font-medium"
                          style={{
                            background: 'linear-gradient(145deg, #2a1818 0%, #171515 100%)',
                            color: 'var(--peach)',
                            fontFamily: 'var(--font-landing-serif), Georgia, serif',
                          }}
                          aria-hidden
                        >
                          {artist.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className={exploreStyles.cardBody}>
                      <p className={exploreStyles.cardName}>{artist.name}</p>
                      {artist.location ? (
                        <p className={exploreStyles.cardMeta}>{artist.location}</p>
                      ) : null}
                      {bio ? <p className={exploreStyles.cardBio}>{bio}</p> : null}
                      <p className={exploreStyles.cardCount}>
                        {artist.productCount} {artist.productCount === 1 ? 'artwork' : 'artworks'}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div className={exploreStyles.stickyCta}>
        <div className={exploreStyles.stickyCtaInner}>
          <span className={exploreStyles.stickyHint}>Ready to collect?</span>
          <Link href={experienceUrl} className={landingStyles.btnPrimary} style={{ marginBottom: 0 }}>
            Start your collection
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  )
}
