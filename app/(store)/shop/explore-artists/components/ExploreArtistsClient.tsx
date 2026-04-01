'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import type { ExploreArtistRow } from '@/lib/shop/explore-artists-order'
import landingStyles from '../../home-v2/landing.module.css'
import exploreStyles from '../explore-artists.module.css'
import { useLandingScrollReveal } from '../../home-v2/hooks/useLandingScrollReveal'

function shortBio(s: string | undefined, max = 220): string | undefined {
  if (!s) return undefined
  const t = s.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

type Props = {
  artists: ExploreArtistRow[]
  experienceUrl: string
}

type FilterKey = 'all' | 'featured' | 'withBio'

export function ExploreArtistsClient({ artists, experienceUrl }: Props) {
  const heroReveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const philosophyReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px', mode: 'stagger' })
  const featuredReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px' })
  const gridReveal = useLandingScrollReveal({
    rootMargin: '520px 0px -18% 0px',
    threshold: 0.01,
    mode: 'stagger',
  })

  const featuredCount = Math.min(artists.length, 12)
  const withBioCount = artists.reduce((acc, a) => acc + (a.bio ? 1 : 0), 0)
  const [filter, setFilter] = React.useState<FilterKey>('all')

  const featured = artists.slice(0, featuredCount)
  const filtered =
    filter === 'featured'
      ? featured
      : filter === 'withBio'
        ? artists.filter((a) => !!a.bio)
        : artists

  const spotlight = featured[0]
  const spotlightBio = shortBio(spotlight?.bio)
  const spotlightMeta = [spotlight?.location, spotlight?.productCount ? `${spotlight.productCount} works` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <div className={exploreStyles.wrap}>
        <section ref={heroReveal.ref} className={cn(exploreStyles.hero, heroReveal.className)} aria-label="Hero">
          <div className={exploreStyles.heroBgGradient} aria-hidden />
          <div className={exploreStyles.heroContent}>
            <div className={exploreStyles.heroEyebrow}>The Artists</div>
            <h1 className={exploreStyles.heroH1}>
              Every piece has
              <br />a <em>street.</em>
            </h1>
            <p className={exploreStyles.heroDesc}>
              100+ independent artists from 40+ countries. Every artwork in our collection began on a wall, in
              an alley, in a city that didn&apos;t ask permission. This is where you meet them.
            </p>
            <div className={exploreStyles.heroStats}>
              <div className={exploreStyles.stat}>
                <span className={exploreStyles.statN}>{artists.length}+</span>
                <span className={exploreStyles.statL}>Artists</span>
              </div>
              <div className={exploreStyles.stat}>
                <span className={exploreStyles.statN}>40+</span>
                <span className={exploreStyles.statL}>Countries</span>
              </div>
              <div className={exploreStyles.stat}>
                <span className={exploreStyles.statN}>30%</span>
                <span className={exploreStyles.statL}>To the artist</span>
              </div>
              <div className={exploreStyles.stat}>
                <span className={exploreStyles.statN}>★ 5.0</span>
                <span className={exploreStyles.statL}>Rated</span>
              </div>
            </div>
          </div>
          <div className={exploreStyles.scrollHint} aria-hidden>
            <div className={exploreStyles.scrollLine} />
            <span>Explore</span>
          </div>
        </section>

        <section
          ref={philosophyReveal.ref}
          className={cn(exploreStyles.philosophy, philosophyReveal.className)}
          aria-label="Philosophy"
        >
          <div className={exploreStyles.philosophyInner}>
            <div className={cn(landingStyles.landingStagger, exploreStyles.philosophyEyebrow)} style={{ ['--stagger' as string]: 0 }}>
              Why the artists
            </div>
            <p className={cn(landingStyles.landingStagger, exploreStyles.philosophyQuote)} style={{ ['--stagger' as string]: 1 }}>
              “We don&apos;t license stock. We don&apos;t source prints.
              <br />
              We find the people painting walls at <em>3am</em>
              <br />
              in cities that don&apos;t ask permission.”
            </p>
            <p className={cn(landingStyles.landingStagger, exploreStyles.philosophyBody)} style={{ ['--stagger' as string]: 2 }}>
              Every artist in our collection is independently sourced.
              <br />
              Every edition is exclusive to Street Collector.
              <br />
              When you buy a print, <strong>30% goes directly to the artist.</strong>
              <br />
              No middlemen. No galleries. No gatekeepers.
            </p>
          </div>
        </section>

        <div className={exploreStyles.filterBar} role="navigation" aria-label="Artist filters">
          <button
            type="button"
            className={cn(exploreStyles.filterBtn, filter === 'all' && exploreStyles.filterBtnActive)}
            onClick={() => setFilter('all')}
          >
            All Artists <span className="sr-only">({artists.length})</span>
          </button>
          <button
            type="button"
            className={cn(exploreStyles.filterBtn, filter === 'featured' && exploreStyles.filterBtnActive)}
            onClick={() => setFilter('featured')}
          >
            <span className={exploreStyles.filterDot} aria-hidden /> Featured <span className="sr-only">({featuredCount})</span>
          </button>
          <button
            type="button"
            className={cn(exploreStyles.filterBtn, filter === 'withBio' && exploreStyles.filterBtnActive)}
            onClick={() => setFilter('withBio')}
          >
            With Bio <span className="sr-only">({withBioCount})</span>
          </button>
        </div>

        {spotlight ? (
          <section ref={featuredReveal.ref} className={cn(exploreStyles.featuredSection, featuredReveal.className)} aria-label="Featured">
            <div className={exploreStyles.featuredHeader}>
              <div>
                <div className={exploreStyles.eyebrowInline}>Featured This Month</div>
                <h2 className={exploreStyles.featuredTitle}>
                  In the <em>spotlight.</em>
                </h2>
              </div>
              <span className={exploreStyles.featuredRotate}>Rotates monthly</span>
            </div>

            <div className={exploreStyles.featuredArtist}>
              <div className={exploreStyles.featuredMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element -- proxied CDN */} 
                <img
                  className={exploreStyles.featuredMediaImg}
                  src={spotlight.image ? getProxiedImageUrl(spotlight.image) : ''}
                  alt={spotlight.name}
                  loading="eager"
                  decoding="async"
                />
                <div className={exploreStyles.featuredMediaOverlay} aria-hidden />
                <div className={exploreStyles.featuredNumber} aria-hidden>
                  01
                </div>
              </div>
              <div className={exploreStyles.featuredContent}>
                <div className={exploreStyles.featuredMeta}>{spotlightMeta || 'Street Collector · Limited editions'}</div>
                <h3 className={exploreStyles.featuredName}>{spotlight.name}</h3>
                <p className={exploreStyles.featuredHook}>
                  “Start here. Read the bio. Then follow the thread into the rest of the collection.”
                </p>
                {spotlightBio ? <p className={exploreStyles.featuredBio}>{spotlightBio}</p> : null}
                <blockquote className={exploreStyles.featuredPullquote}>
                  “When you collect, you fund the person behind the wall.”
                </blockquote>
                <Link href={`/shop/artists/${spotlight.slug}`} className={exploreStyles.btnFeatured}>
                  View Full Profile
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        <section ref={gridReveal.ref} className={cn(exploreStyles.artistsSection, gridReveal.className)} aria-label="Artists grid">
          <div className={exploreStyles.artistsHeader}>
            <div>
              <div className={exploreStyles.eyebrowInline}>The Collection</div>
              <h2 className={exploreStyles.featuredTitle}>
                Meet the <em>people</em>
                <br />
                behind the prints.
              </h2>
            </div>
            <p className={exploreStyles.artistsHeaderNote}>Each card opens the artist profile. Click any artist to go deeper.</p>
          </div>

          <div className={exploreStyles.artistsGrid} id="artists-grid">
            {filtered.map((artist, idx) => {
              const hook = artist.bio ? `“${shortBio(artist.bio, 72)}”` : '“Click to explore the full profile.”'
              return (
                <article
                  key={artist.slug}
                  className={cn(landingStyles.landingStagger, exploreStyles.artistCard)}
                  style={{ ['--stagger' as string]: idx % 10 }}
                >
                  <div className={exploreStyles.artistCardInner}>
                    <div className={exploreStyles.artistCardMedia}>
                      {artist.image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- proxied CDN
                        <img
                          className={exploreStyles.artistCardImg}
                          src={getProxiedImageUrl(artist.image)}
                          alt={artist.name}
                          loading={idx < 10 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-5xl"
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
                      <div className={exploreStyles.artistCardOverlay} aria-hidden />
                      <div className={exploreStyles.artistCardInfo}>
                        <div className={exploreStyles.artistCardName}>{artist.name}</div>
                        <div className={exploreStyles.artistCardCity}>{artist.location ?? 'Street Collector'}</div>
                        <div className={exploreStyles.artistCardHook}>{hook}</div>
                      </div>
                    </div>
                    <div className={exploreStyles.artistCardFooter}>
                      <div className={exploreStyles.editionsCount}>
                        <span>{artist.productCount}</span> editions
                      </div>
                      <Link href={`/shop/artists/${artist.slug}`} className={exploreStyles.cardExploreLink}>
                        Explore
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className={exploreStyles.finalCta} aria-label="Final CTA">
          <div className={exploreStyles.philosophyEyebrow} style={{ marginBottom: 24 }}>
            Your Collection Awaits
          </div>
          <h2 className={exploreStyles.finalTitle}>
            You&apos;ve met the artists.
            <br />
            Now <em>collect their work.</em>
          </h2>
          <p className={exploreStyles.finalSub}>
            Every piece is limited. Every edition has a number. The ones that sell out don&apos;t come back.
          </p>
          <div className={exploreStyles.finalBtns}>
            <Link href={experienceUrl} className={landingStyles.btnPrimary} style={{ marginBottom: 0 }}>
              Start your collection
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#artists-grid" className={landingStyles.btnOutline}>
              Browse all artists
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
