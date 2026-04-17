'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import type { ExploreArtistRow } from '@/lib/shop/explore-artists-order'
import landingStyles from '../../home-v2/landing.module.css'
import exploreStyles from '../explore-artists.module.css'
import { useLandingScrollReveal } from '../../home-v2/hooks/useLandingScrollReveal'
import { exploreArtistsContent } from '@/content/explore-artists'
import { MobileStickyCta } from '@/components/shop/MobileStickyCta'

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

/** Subset of Shopify product fields returned by GET /api/shop/artists/[slug] */
type ArtistApiProduct = {
  id: string
  handle: string
  title: string
  featuredImage?: { url?: string; altText?: string | null } | null
}

function useIsFinePointer() {
  const [fine, setFine] = React.useState(false)
  React.useEffect(() => {
    // Only enable the custom cursor on desktop-class viewports with a
    // fine pointer. Below 1024px the cursor is noisy and fights hover states.
    const mq = window.matchMedia('(pointer: fine) and (min-width: 1024px)')
    const apply = () => setFine(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return fine
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

export function ExploreArtistsClient({ artists, experienceUrl }: Props) {
  const heroReveal = useLandingScrollReveal({ rootMargin: '0px 0px -8% 0px' })
  const philosophyReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px', mode: 'stagger' })
  const featuredReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px' })
  const gridReveal = useLandingScrollReveal({
    rootMargin: '520px 0px -18% 0px',
    threshold: 0.01,
    mode: 'stagger',
  })
  const mapReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px', mode: 'stagger' })
  const voicesReveal = useLandingScrollReveal({ rootMargin: '0px 0px -12% 0px', mode: 'stagger' })

  const featuredCount = Math.min(artists.length, 12)
  const withBioCount = artists.reduce((acc, a) => acc + (a.bio ? 1 : 0), 0)
  const locatedCities = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of artists) {
      const loc = a.location?.trim()
      if (loc) set.add(loc)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [artists])
  const [filter, setFilter] = React.useState<FilterKey>('all')

  const featured = artists.slice(0, featuredCount)

  const spotlightIndex = React.useMemo(() => {
    if (featured.length <= 1) return 0
    const now = new Date()
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
    const diffDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000)
    const isoWeek = Math.floor(diffDays / 7)
    return isoWeek % featured.length
  }, [featured.length])
  const filtered =
    filter === 'featured'
      ? featured
      : filter === 'withBio'
        ? artists.filter((a) => !!a.bio)
        : artists

  const spotlight = featured[spotlightIndex] ?? featured[0]
  const spotlightBio = shortBio(spotlight?.bio)
  const spotlightMeta = [spotlight?.location, spotlight?.productCount ? `${spotlight.productCount} works` : null]
    .filter(Boolean)
    .join(' · ')
  const spotlightPullQuote = React.useMemo(() => {
    if (!spotlight) return null
    return (
      exploreArtistsContent.spotlightPullQuotes.find((q) => q.artistSlug === spotlight.slug) ?? null
    )
  }, [spotlight])

  const isFinePointer = useIsFinePointer()
  const reducedMotion = usePrefersReducedMotion()

  const [cursor, setCursor] = React.useState({ x: 0, y: 0, rx: 0, ry: 0 })
  React.useEffect(() => {
    if (!isFinePointer || reducedMotion) return
    let x = 0
    let y = 0
    let rx = 0
    let ry = 0
    let raf = 0
    const onMove = (e: MouseEvent) => {
      x = e.clientX
      y = e.clientY
    }
    const tick = () => {
      rx += (x - rx) * 0.12
      ry += (y - ry) * 0.12
      setCursor({ x, y, rx, ry })
      raf = window.requestAnimationFrame(tick)
    }
    document.addEventListener('mousemove', onMove, { passive: true })
    raf = window.requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('mousemove', onMove)
      window.cancelAnimationFrame(raf)
    }
  }, [isFinePointer, reducedMotion])

  const [lightboxSlug, setLightboxSlug] = React.useState<string | null>(null)
  const lightboxArtist = lightboxSlug ? artists.find((a) => a.slug === lightboxSlug) : undefined
  const [lightboxProducts, setLightboxProducts] = React.useState<ArtistApiProduct[]>([])
  const [lightboxProductsLoading, setLightboxProductsLoading] = React.useState(false)
  const [lightboxProductsError, setLightboxProductsError] = React.useState(false)

  React.useEffect(() => {
    if (!lightboxSlug || !lightboxArtist) {
      setLightboxProducts([])
      setLightboxProductsLoading(false)
      setLightboxProductsError(false)
      return
    }
    const ac = new AbortController()
    setLightboxProducts([])
    setLightboxProductsLoading(true)
    setLightboxProductsError(false)
    const url = `/api/shop/artists/${encodeURIComponent(lightboxSlug)}?vendor=${encodeURIComponent(lightboxArtist.name)}`
    fetch(url, { signal: ac.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Artist fetch failed')
        return r.json() as Promise<{ products?: ArtistApiProduct[] }>
      })
      .then((data) => setLightboxProducts(Array.isArray(data.products) ? data.products : []))
      .catch((e: unknown) => {
        const name = e && typeof e === 'object' && 'name' in e ? String((e as { name: string }).name) : ''
        if (name === 'AbortError') return
        setLightboxProductsError(true)
      })
      .finally(() => {
        if (!ac.signal.aborted) setLightboxProductsLoading(false)
      })
    return () => ac.abort()
  }, [lightboxSlug, lightboxArtist?.name])

  const related = React.useMemo(() => {
    if (!lightboxArtist) return []
    const pool = artists.filter((a) => a.slug !== lightboxArtist.slug)
    return pool.slice(0, 3)
  }, [artists, lightboxArtist])

  const lightboxRef = React.useRef<HTMLDivElement | null>(null)
  const pageShellRef = React.useRef<HTMLDivElement | null>(null)
  const lastTriggerRef = React.useRef<HTMLElement | null>(null)

  const openLightbox = React.useCallback((slug: string) => {
    lastTriggerRef.current = (document.activeElement as HTMLElement) ?? null
    setLightboxSlug(slug)
  }, [])

  const closeLightbox = React.useCallback(() => {
    setLightboxSlug(null)
  }, [])

  React.useEffect(() => {
    if (!lightboxSlug) {
      // Restore focus to the originating element when closing.
      const el = lastTriggerRef.current
      if (el && typeof el.focus === 'function') {
        window.requestAnimationFrame(() => el.focus())
      }
      return
    }

    // Make background inert while the dialog is open (a11y + escape-hatch safety).
    const shell = pageShellRef.current
    if (shell) shell.setAttribute('inert', '')
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog.
    const dialog = lightboxRef.current
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    const first = focusables?.[0]
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox()
        return
      }
      if (e.key !== 'Tab' || !focusables || focusables.length === 0) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (shell) shell.removeAttribute('inert')
      document.body.style.overflow = ''
    }
  }, [lightboxSlug, closeLightbox])

  return (
    <>
      {isFinePointer && !reducedMotion ? (
        <>
          <div
            className={exploreStyles.cursor}
            style={{ transform: `translate(${cursor.x - 4}px, ${cursor.y - 4}px)` }}
            aria-hidden
          />
          <div
            className={exploreStyles.cursorRing}
            style={{ transform: `translate(${cursor.rx - 18}px, ${cursor.ry - 18}px)` }}
            aria-hidden
          />
        </>
      ) : null}

      <div className={exploreStyles.wrap} ref={pageShellRef}>
        <section ref={heroReveal.ref} className={cn(exploreStyles.hero, heroReveal.className)} aria-label="Hero">
          <div className={exploreStyles.heroBgGradient} aria-hidden />
          <div className={exploreStyles.heroContent}>
            <div className={exploreStyles.heroEyebrow}>The Artists</div>
            <h1 className={exploreStyles.heroH1}>
              Every piece has
              <br />a <em>street.</em>
            </h1>
            <p className={exploreStyles.heroDesc}>
              {artists.length}+ independent artists across 40+ countries. Each name here ties to real street or
              studio practice—not a stock library. Open a profile for the story and every edition we carry.
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
              Every artist in this directory is independently sourced.
              <br />
              Editions you see here are the runs we carry—built with the artist, not repackaged stock.
              <br />
              When you buy a print, <strong>30% goes to the artist.</strong>
              <br />
              Fewer hands in the middle. More of the price reaches the person who made the work.
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
            With a story <span className="sr-only">({withBioCount})</span>
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
              <span className={exploreStyles.featuredRotate}>{exploreArtistsContent.featured.rotateLabel}</span>
            </div>

            <div className={exploreStyles.featuredArtist}>
              <div className={exploreStyles.featuredMedia}>
                {spotlight.image ? (
                  <Image
                    className={exploreStyles.featuredMediaImg}
                    src={getProxiedImageUrl(spotlight.image)}
                    alt={spotlight.name}
                    fill
                    sizes="(max-width: 960px) 100vw, 50vw"
                    priority
                    style={{ objectFit: 'cover' }}
                  />
                ) : null}
                <div className={exploreStyles.featuredMediaOverlay} aria-hidden />
                <div className={exploreStyles.featuredNumber} aria-hidden>
                  01
                </div>
              </div>
              <div className={exploreStyles.featuredContent}>
                <div className={exploreStyles.featuredMeta}>{spotlightMeta || 'Street Collector · Limited editions'}</div>
                <h3 className={exploreStyles.featuredName}>{spotlight.name}</h3>
                <p className={exploreStyles.featuredHook}>
                  Full profile: long-form story, history when we have it, and every edition in the shop—in one place.
                </p>
                {spotlightBio ? <p className={exploreStyles.featuredBio}>{spotlightBio}</p> : null}
                {spotlightPullQuote ? (
                  <blockquote className={exploreStyles.featuredPullquote}>
                    {spotlightPullQuote.quote}
                    {spotlightPullQuote.attribution ? (
                      <footer style={{ marginTop: 8, fontStyle: 'normal', fontSize: 12, opacity: 0.7 }}>
                        — {spotlightPullQuote.attribution}
                      </footer>
                    ) : null}
                  </blockquote>
                ) : null}
                <button
                  type="button"
                  className={exploreStyles.btnFeatured}
                  onClick={() => openLightbox(spotlight.slug)}
                >
                  {exploreArtistsContent.featured.ctaLabel}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
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
            <p className={exploreStyles.artistsHeaderNote}>
              Tap a card for a quick preview, or open the full profile for story, press, and works.
            </p>
          </div>

          <div className={exploreStyles.artistsGrid} id="artists-grid">
            {filtered.map((artist, idx) => {
              const hook = artist.bio
                ? `“${shortBio(artist.bio, 72)}”`
                : exploreArtistsContent.collection.emptyHook
              return (
                <article
                  key={artist.slug}
                  className={cn(landingStyles.landingStagger, exploreStyles.artistCard)}
                  style={{ ['--stagger' as string]: idx % 10 }}
                >
                  <div className={exploreStyles.artistCardInner}>
                    <Link
                      href={`/shop/artists/${artist.slug}`}
                      prefetch={false}
                      className={exploreStyles.artistCardMediaButton}
                      aria-label={`Open ${artist.name} profile`}
                    >
                      <div className={exploreStyles.artistCardMedia}>
                      {artist.image ? (
                        <Image
                          className={exploreStyles.artistCardImg}
                          src={getProxiedImageUrl(artist.image)}
                          alt={artist.name}
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw"
                          loading={idx < 6 ? 'eager' : 'lazy'}
                          style={{ objectFit: 'cover' }}
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
                    </Link>
                    <div className={exploreStyles.artistCardFooter}>
                      <div className={exploreStyles.editionsCount}>
                        <span>{artist.productCount}</span> editions
                      </div>
                      <button
                        type="button"
                        className={exploreStyles.cardExploreLink}
                        onClick={() => openLightbox(artist.slug)}
                        aria-label={`Quick preview: ${artist.name}`}
                      >
                        Preview
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section
          ref={mapReveal.ref}
          className={cn(exploreStyles.mapSection, mapReveal.className)}
          aria-label="Where our artists work"
        >
          <div className={cn(landingStyles.landingStagger, exploreStyles.mapEyebrow)} style={{ ['--stagger' as string]: 0 }}>
            Where they work
          </div>
          <h2 className={cn(landingStyles.landingStagger, exploreStyles.mapTitle)} style={{ ['--stagger' as string]: 1 }}>
            Art that crossed an ocean
            <br />
            to land <em>in your Street Lamp.</em>
          </h2>
          {locatedCities.length > 0 ? (
            <div
              className={cn(landingStyles.landingStagger, exploreStyles.mapCityList)}
              style={{ ['--stagger' as string]: 2 }}
            >
              {locatedCities.map((city) => (
                <span key={city} className={exploreStyles.mapCityChip}>
                  {city}
                </span>
              ))}
            </div>
          ) : null}
          <div className={cn(landingStyles.landingStagger, exploreStyles.mapStats)} style={{ ['--stagger' as string]: 3 }}>
            <div className={exploreStyles.mapStat}>
              <span className={exploreStyles.mapStatN}>{artists.length}</span>
              <span className={exploreStyles.mapStatL}>Artists</span>
            </div>
            {locatedCities.length > 0 ? (
              <div className={exploreStyles.mapStat}>
                <span className={exploreStyles.mapStatN}>{locatedCities.length}</span>
                <span className={exploreStyles.mapStatL}>Cities on record</span>
              </div>
            ) : null}
            <div className={exploreStyles.mapStat}>
              <span className={exploreStyles.mapStatN}>{withBioCount}</span>
              <span className={exploreStyles.mapStatL}>With full stories</span>
            </div>
          </div>
        </section>

        <section
          ref={voicesReveal.ref}
          className={cn(exploreStyles.voicesSection, voicesReveal.className)}
          aria-label="Collector voices"
        >
          <div className={exploreStyles.voicesHeader}>
            <div>
              <div className={cn(landingStyles.landingStagger, exploreStyles.eyebrowInline)} style={{ ['--stagger' as string]: 0 }}>
                Collector Voices
              </div>
              <h2 className={cn(landingStyles.landingStagger, exploreStyles.voicesTitle)} style={{ ['--stagger' as string]: 1 }}>
                The story lives
                <br />
                <em>in your Street Lamp.</em>
              </h2>
            </div>
            <div className={cn(landingStyles.landingStagger, exploreStyles.voicesRating)} style={{ ['--stagger' as string]: 2 }}>
              <div className={exploreStyles.voicesStars} aria-hidden>
                ★★★★★
              </div>
              <div className={exploreStyles.voicesCaption}>Rated 5.0 · 3,000+ collectors</div>
            </div>
          </div>

          <div className={exploreStyles.voicesGrid}>
            {exploreArtistsContent.voices.items.map((voice, idx) => (
              <article
                key={`${voice.author}-${idx}`}
                className={cn(landingStyles.landingStagger, exploreStyles.voiceCard)}
                style={{ ['--stagger' as string]: idx }}
              >
                <div>
                  <div className={exploreStyles.voiceStars} aria-hidden>
                    ★★★★★
                  </div>
                  <p className={exploreStyles.voiceText}>{voice.quote}</p>
                </div>
                <div>
                  <div className={exploreStyles.voiceAuthor}>{voice.author}</div>
                  <div className={exploreStyles.voiceLocation}>{voice.location}</div>
                </div>
              </article>
            ))}
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
            Runs are finite. Each edition is numbered. When a run sells out here, it doesn&apos;t return.
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

      <div
        ref={lightboxRef}
        className={cn(exploreStyles.lightbox, lightboxArtist && exploreStyles.lightboxOpen)}
        role="dialog"
        aria-modal="true"
        aria-label={lightboxArtist ? `Artist details: ${lightboxArtist.name}` : 'Artist details'}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLightbox()
        }}
      >
        {lightboxArtist ? (
          <div className={exploreStyles.lightboxInner}>
            <div className={exploreStyles.lightboxMedia}>
              {lightboxArtist.image ? (
                <Image
                  className={exploreStyles.lightboxImg}
                  src={getProxiedImageUrl(lightboxArtist.image)}
                  alt={lightboxArtist.name}
                  fill
                  sizes="(max-width: 960px) 100vw, 50vw"
                  priority
                  style={{ objectFit: 'cover' }}
                />
              ) : null}
              <div className={exploreStyles.lightboxMediaOverlay} aria-hidden />
            </div>
            <div className={exploreStyles.lightboxContent}>
              <button type="button" className={exploreStyles.lightboxClose} onClick={closeLightbox} aria-label="Close">
                ✕
              </button>

              <div className={exploreStyles.lbMeta}>
                {(lightboxArtist.location ?? 'Street Collector') + ' · ' + lightboxArtist.productCount + ' editions'}
              </div>
              <h2 className={exploreStyles.lbName}>{lightboxArtist.name}</h2>
              {lightboxArtist.bio ? <p className={exploreStyles.lbStory}>{lightboxArtist.bio}</p> : null}

              <div className={exploreStyles.lbActions}>
                <Link href={`/shop/artists/${lightboxArtist.slug}`} className={exploreStyles.lbCta}>
                  Open full profile
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href={experienceUrl} className={exploreStyles.lbCtaOutline}>
                  Start collecting
                </Link>
              </div>

              <div className={exploreStyles.lbArtworks}>
                <div className={exploreStyles.lbArtworksTitle}>Editions on Street Collector</div>
                {lightboxProductsLoading ? (
                  <p className={exploreStyles.lbArtworksHint} aria-live="polite">
                    Loading editions…
                  </p>
                ) : null}
                {lightboxProductsError ? (
                  <p className={exploreStyles.lbArtworksHint} role="alert">
                    We couldn&apos;t load editions in this preview. Use Open full profile for the complete list.
                  </p>
                ) : null}
                {!lightboxProductsLoading && !lightboxProductsError && lightboxProducts.length === 0 ? (
                  <p className={exploreStyles.lbArtworksHint}>
                    No shop editions are linked to this artist in preview yet—the full profile may list more.
                  </p>
                ) : null}
                {lightboxProducts.length > 0 ? (
                  <ul className={exploreStyles.lbArtworksGrid}>
                    {lightboxProducts.slice(0, 12).map((p) => (
                      <li key={p.id}>
                        <Link href={`/shop/${p.handle}`} className={exploreStyles.lbArtworkCard}>
                          {p.featuredImage?.url ? (
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                              <Image
                                src={getProxiedImageUrl(p.featuredImage.url)}
                                alt={p.featuredImage.altText?.trim() || p.title}
                                fill
                                sizes="(max-width: 960px) 33vw, 150px"
                                loading="lazy"
                                style={{ objectFit: 'cover' }}
                              />
                            </div>
                          ) : (
                            <div className={exploreStyles.lbArtworkPlaceholder} aria-hidden />
                          )}
                          <span className={exploreStyles.lbArtworkTitle}>{p.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {related.length ? (
                <div className={exploreStyles.lbRelated}>
                  <div className={exploreStyles.lbRelatedTitle}>You might also connect with</div>
                  <div className={exploreStyles.lbRelatedGrid}>
                    {related.map((a) => (
                      <button
                        key={a.slug}
                        type="button"
                        className={exploreStyles.lbRelatedCard}
                        onClick={() => openLightbox(a.slug)}
                      >
                        {a.image ? (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                            <Image
                              src={getProxiedImageUrl(a.image)}
                              alt={a.name}
                              fill
                              sizes="(max-width: 960px) 33vw, 150px"
                              loading="lazy"
                              style={{ objectFit: 'cover', filter: 'saturate(0.6) brightness(0.7)' }}
                            />
                          </div>
                        ) : null}
                        <div className={exploreStyles.lbRelatedName}>{a.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <MobileStickyCta href={experienceUrl} label={exploreArtistsContent.hero.ctaLabel} />
    </>
  )
}
