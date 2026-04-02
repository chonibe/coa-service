'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { getInstagramEmbedSrc } from '@/lib/shop/instagram-embed'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import { useCart } from '@/lib/shop/CartContext'
import { trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import styles from './artist-profile.module.css'

type TabId = 'overview' | 'works' | 'exhibitions' | 'instagram'

type WorkFilter = 'all' | 'available' | 'sold' | string

type ListArtist = {
  name: string
  slug: string
  bio?: string
  image?: string
  productCount: number
}

function editionLabel(product: ShopifyProduct): string | undefined {
  const row = product.metafields?.find((m) => m.namespace === 'custom' && m.key === 'edition_size')
  return row?.value?.trim()
}

function seasonFromTags(tags: string[]): string | undefined {
  for (const x of tags) {
    if (/^season\s*\d+/i.test(x)) {
      return x
        .replace(/^season\s*/i, 'Season ')
        .replace(/\s+/g, ' ')
        .trim()
    }
    const m = x.match(/^s(\d+)$/i)
    if (m) return `Season ${m[1]}`
  }
  return undefined
}

function bioParagraphs(bio: string | undefined): string[] {
  if (!bio?.trim()) return []
  const noTags = bio.replace(/<[^>]*>/g, ' ')
  const blocks = noTags
    .split(/\n\n+/)
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  if (blocks.length > 1) return blocks
  const plain = noTags.replace(/\s+/g, ' ').trim()
  return plain.split(/(?<=[.!?])\s+/).reduce((acc: string[], part) => {
        const cur = acc.length ? acc[acc.length - 1] + ' ' + part : part
        if (cur.length > 220 && acc.length) {
          acc.push(part)
        } else if (acc.length) {
          acc[acc.length - 1] = cur
        } else {
          acc.push(part)
        }
        return acc
      }, [])
}

type Props = {
  artist: ArtistProfileApiResponse
  earlyAccessCoupon?: string | null
}

export function ArtistProfilePageClient({ artist, earlyAccessCoupon }: Props) {
  const router = useRouter()
  const cart = useCart()
  const [tab, setTab] = React.useState<TabId>('overview')
  const [workFilter, setWorkFilter] = React.useState<WorkFilter>('all')
  const [navScrolled, setNavScrolled] = React.useState(false)
  const [related, setRelated] = React.useState<ListArtist[]>([])

  const profile = artist.profile ?? {}
  const stats = artist.stats ?? { editionCount: artist.products.length, remainingCount: 0 }

  React.useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    let cancelled = false
    fetch('/api/shop/artists')
      .then((r) => r.json())
      .then((data: { artists?: ListArtist[] }) => {
        if (cancelled || !data.artists?.length) return
        const pool = data.artists.filter((a) => a.slug !== artist.slug)
        setRelated(pool.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [artist.slug])

  const seasonTags = React.useMemo(() => {
    const set = new Set<string>()
    for (const p of artist.products) {
      const s = seasonFromTags(p.tags)
      if (s) set.add(s)
    }
    return [...set].sort()
  }, [artist.products])

  const filteredProducts = React.useMemo(() => {
    let list = artist.products
    if (workFilter === 'available') list = list.filter((p) => p.availableForSale)
    if (workFilter === 'sold') list = list.filter((p) => !p.availableForSale)
    if (workFilter !== 'all' && workFilter !== 'available' && workFilter !== 'sold') {
      list = list.filter((p) => seasonFromTags(p.tags) === workFilter)
    }
    return list
  }, [artist.products, workFilter])

  const exhibitionsByYear = React.useMemo(() => {
    const rows = (profile.exhibitions ?? []).filter((r) => Number.isFinite(r.year))
    const map = new Map<number, typeof rows>()
    for (const row of rows) {
      const y = row.year
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(row)
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [profile.exhibitions])

  const heroImage = artist.image
  const eyebrow = [profile.location, profile.activeSince ? `Active since ${profile.activeSince}` : null]
    .filter(Boolean)
    .join(' · ')

  const onTab = (id: TabId) => {
    setTab(id)
    const el = document.getElementById('artist-tabs')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const addToCart = (product: ShopifyProduct) => {
    const variant = product.variants.edges[0]?.node
    if (!variant) return
    cart.addItem({
      productId: product.id,
      variantId: variant.id,
      handle: product.handle,
      title: product.title,
      price: parseFloat(variant.price.amount),
      quantity: 1,
      image: product.featuredImage?.url,
      artistName: product.vendor,
    })
    trackAddToCart({ ...storefrontProductToItem(product, variant, 1), item_list_name: 'artist_profile' })
  }

  const paragraphs = bioParagraphs(artist.bio)

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <nav className={cn(styles.nav, navScrolled && styles.navScrolled)} aria-label="Artist profile">
          <Link href="/shop/street-collector" className={styles.logo}>
            Street Collector
          </Link>
          <div className={styles.navRight}>
            <Link href="/shop/explore-artists" className={styles.navBack}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              All Artists
            </Link>
            <Link href="/experience" className={styles.navCta}>
              Collect this work
            </Link>
          </div>
        </nav>

        <section className={styles.profileHero} aria-label="Artist hero">
          <div className={styles.heroCanvasCol}>
            <div className={styles.heroGradient} aria-hidden />
            <div className={styles.heroPortrait}>
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- proxied CDN
                <img src={getProxiedImageUrl(heroImage)} alt={artist.name} decoding="async" />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-7xl"
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
              <div className={styles.heroPortraitOverlay} aria-hidden />
            </div>
            <div className={styles.heroNumber} aria-hidden>
              01
            </div>
            <div className={styles.heroEditionBadge}>
              <span className={styles.badgeLabel}>Available editions</span>
              <span className={styles.badgeVal}>
                {stats.editionCount} {stats.editionCount === 1 ? 'work' : 'works'} · {stats.remainingCount} remaining
              </span>
            </div>
          </div>
          <div className={styles.heroContentCol}>
            {eyebrow ? <div className={styles.heroEyebrow}>{eyebrow}</div> : null}
            <h1 className={styles.heroName}>{artist.name}</h1>
            {profile.alias ? <div className={styles.heroAlias}>{profile.alias}</div> : null}
            {profile.storyHook ? <p className={styles.heroHook}>&ldquo;{profile.storyHook}&rdquo;</p> : null}
            <div className={styles.heroMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaVal}>{stats.editionCount}</span>
                <span className={styles.metaLabel}>Editions</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaVal}>{stats.remainingCount}</span>
                <span className={styles.metaLabel}>Remaining</span>
              </div>
              {profile.activeSince ? (
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{profile.activeSince}</span>
                  <span className={styles.metaLabel}>Active since</span>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className={styles.tabsBar} id="artist-tabs" role="tablist" aria-label="Artist sections">
          {(
            [
              ['overview', 'Overview'],
              ['works', 'Works'],
              ['exhibitions', 'Exhibitions & Press'],
              ['instagram', 'Instagram'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={cn(styles.tabBtn, tab === id && styles.tabActive)}
              onClick={() => onTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={cn(styles.tabPanel, tab === 'overview' && styles.tabPanelActive)} role="tabpanel" hidden={tab !== 'overview'}>
          <div className={styles.overviewSection}>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewStory}>
                <div className={styles.storyEyebrow}>The Story</div>
                <h2 className={styles.storyH2}>
                  The work behind <em>the name.</em>
                </h2>
                {paragraphs.length ? (
                  paragraphs.map((p, idx) => (
                    <p key={idx} className={styles.storyBody}>
                      {p}
                    </p>
                  ))
                ) : (
                  <p className={styles.storyBody}>
                    We&apos;re still building this profile. For now, open <strong>Works</strong> for pricing, what&apos;s
                    left in each run, and pieces you can add to your Street Lamp.
                  </p>
                )}
                {profile.pullquote ? <blockquote className={styles.storyPullquote}>&ldquo;{profile.pullquote}&rdquo;</blockquote> : null}
                {profile.impactCallout ? (
                  <div className={styles.bioCard}>
                    <div className={styles.bioCardIcon} aria-hidden>
                      →
                    </div>
                    <div className={styles.bioCardText}>
                      {profile.impactCallout.split('\n').map((line, li) => (
                        <p key={li} style={{ margin: '0 0 0.5em' }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className={styles.overviewProcess}>
                <div className={styles.processLabel}>Process</div>
                {profile.processGallery && profile.processGallery.length > 0 ? (
                  <div className={styles.processGrid}>
                    {profile.processGallery.slice(0, 4).map((item, i) => {
                      const igEmbed = getInstagramEmbedSrc(item.url)
                      return (
                        <div key={`${item.url}-${i}`} className={styles.processImg}>
                          {igEmbed ? (
                            <div className={styles.processIgFrame}>
                              <iframe
                                src={igEmbed}
                                title={item.label || `Instagram process ${i + 1}`}
                                loading="lazy"
                                allow="encrypted-media; picture-in-picture"
                                referrerPolicy="strict-origin-when-cross-origin"
                              />
                            </div>
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getProxiedImageUrl(item.url)} alt={item.label || `Process ${i + 1}`} loading="lazy" />
                          )}
                          {item.label ? <div className={styles.processImgLabel}>{item.label}</div> : null}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className={styles.storyBody}>
                    Studio shots, street work in progress, and detail photos land here when we publish them. Until
                    then, use <strong>Works</strong> to see pieces you can add to your Street Lamp.
                  </p>
                )}
                {profile.exclusiveCallout ? (
                  <div className={styles.bioCard} style={{ marginTop: 'auto' }}>
                    <div className={styles.bioCardIcon} style={{ fontSize: 14 }} aria-hidden>
                      ✦
                    </div>
                    <div className={styles.bioCardText}>
                      {profile.exclusiveCallout.split('\n').map((line, li) => (
                        <p key={li} style={{ margin: '0 0 0.5em' }}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={cn(styles.tabPanel, tab === 'works' && styles.tabPanelActive)} role="tabpanel" hidden={tab !== 'works'}>
          <div className={styles.worksSection}>
            <div className={styles.worksHeader}>
              <div>
                <div className={styles.storyEyebrow} style={{ marginBottom: 10 }}>
                  The Collection
                </div>
                <h2 className={styles.storyH2} style={{ marginBottom: 0 }}>
                  {stats.editionCount} editions · {stats.remainingCount} pieces remaining
                </h2>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 260, lineHeight: 1.7, textAlign: 'right' }}>
                Every run is capped. When an edition sells out here, it doesn&apos;t come back.
                {earlyAccessCoupon ? ` Early access: ${earlyAccessCoupon}` : null}
              </p>
            </div>
            <div className={styles.worksFilterBar}>
              <button
                type="button"
                className={cn(styles.filterBtn, workFilter === 'all' && styles.filterActive)}
                onClick={() => setWorkFilter('all')}
              >
                All Works
              </button>
              <button
                type="button"
                className={cn(styles.filterBtn, workFilter === 'available' && styles.filterActive)}
                onClick={() => setWorkFilter('available')}
              >
                Available
              </button>
              <button
                type="button"
                className={cn(styles.filterBtn, workFilter === 'sold' && styles.filterActive)}
                onClick={() => setWorkFilter('sold')}
              >
                Sold Out
              </button>
              {seasonTags.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={cn(styles.filterBtn, workFilter === s && styles.filterActive)}
                  onClick={() => setWorkFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className={styles.worksGrid}>
              {filteredProducts.map((product) => {
                const price = product.priceRange.minVariantPrice
                const ed = editionLabel(product)
                const season = seasonFromTags(product.tags)
                return (
                  <div key={product.id} className={cn(styles.workItem, !product.availableForSale && styles.workSoldOut)}>
                    <Link href={`/shop/${product.handle}`} className={styles.workMedia}>
                      {product.featuredImage?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className={styles.workImg}
                          src={getProxiedImageUrl(product.featuredImage.url)}
                          alt={product.featuredImage.altText || product.title}
                          loading="lazy"
                        />
                      ) : null}
                      <div className={styles.workOverlay} aria-hidden />
                      {ed ? <div className={styles.workEdition}>{ed}</div> : null}
                      {!product.availableForSale ? <div className={styles.workSold}>Sold Out</div> : null}
                    </Link>
                    <div className={styles.workInfo}>
                      <div className={styles.workTitle}>{product.title}</div>
                      <div className={styles.workYear}>{[season].filter(Boolean).join(' · ')}</div>
                      <div className={styles.workFooter}>
                        <span className={cn(styles.workPrice, !product.availableForSale && styles.workPriceSold)}>
                          {product.availableForSale ? formatPrice(price) : 'Sold out'}
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {product.availableForSale ? (
                            <button type="button" className={styles.workCta} onClick={() => addToCart(product)}>
                              Add to cart
                            </button>
                          ) : null}
                          <Link href="/experience" className={cn(styles.workCta, styles.workCtaSecondary)}>
                            Add to lamp
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {filteredProducts.length === 0 ? (
              <p className={styles.mutedNote}>Nothing matches this filter—try All Works or another season.</p>
            ) : null}
          </div>
        </div>

        <div className={cn(styles.tabPanel, tab === 'exhibitions' && styles.tabPanelActive)} role="tabpanel" hidden={tab !== 'exhibitions'}>
          <div className={styles.exhibitionsSection}>
            <div className={cn(styles.exhibitionsInner, styles.exhibitionsTimeline)}>
              <div className={styles.storyEyebrow}>Exhibition History</div>
              <h2 className={styles.storyH2}>
                Shows, murals, <em>and milestones.</em>
              </h2>
              {exhibitionsByYear.length ? (
                exhibitionsByYear.map(([year, rows]) => (
                  <div key={year} className={styles.yearGroup}>
                    <div className={styles.yearLabel}>{year}</div>
                    {rows.map((row, i) => (
                      <div key={i} className={styles.exRow}>
                        <div className={styles.exType}>{row.type}</div>
                        <div className={styles.exInfo}>
                          <div className={styles.exTitle}>{row.title}</div>
                          {row.venue?.trim() ? <div className={styles.exVenue}>{row.venue}</div> : null}
                        </div>
                        <div className={styles.exCity}>{row.city?.trim() || ''}</div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className={styles.storyBody}>
                  We don&apos;t list shows and public projects on this profile yet. Verified history appears here
                  when it&apos;s published—newest year first.
                </p>
              )}
            </div>
          </div>
          <div className={styles.pressSection}>
            <div className={styles.pressEyebrow}>Press &amp; Features</div>
            {profile.press && profile.press.length > 0 ? (
              <div className={styles.pressGrid}>
                {profile.press.map((card, i) => (
                  <div key={i} className={styles.pressCard}>
                    <div className={styles.pressOutlet}>
                      {card.outlet}
                      {card.year ? ` · ${card.year}` : ''}
                    </div>
                    <p className={styles.pressQuote}>&ldquo;{card.quote}&rdquo;</p>
                    {card.url ? (
                      <a href={card.url} target="_blank" rel="noopener noreferrer" className={styles.pressLink}>
                        Read the piece
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.storyBody}>
                Verified quotes and links from press will show here once they&apos;re added. Check the artist&apos;s
                site or search their name if you want to read coverage today.
              </p>
            )}
          </div>
        </div>

        <div className={cn(styles.tabPanel, tab === 'instagram' && styles.tabPanelActive)} role="tabpanel" hidden={tab !== 'instagram'}>
          <div className={styles.instagramSection}>
            <div className={styles.instagramHeader}>
              <div className={styles.storyEyebrow}>Instagram</div>
              <h2 className={styles.storyH2}>
                The work, the street,
                <br />
                <em>the process.</em>
              </h2>
              {artist.instagram ? <div className={styles.instagramHandle}>{artist.instagram}</div> : null}
              {!artist.instagram ? (
                <p className={styles.storyBody} style={{ marginTop: 12 }}>
                  We don&apos;t have a linked Instagram handle on file for this artist yet. Their editions are still
                  under <strong>Works</strong> if you want to collect.
                </p>
              ) : null}
            </div>
            {profile.instagramShowcase && profile.instagramShowcase.length > 0 ? (
              <div className={styles.instagramGrid}>
                {profile.instagramShowcase.map((cell, i) => {
                  const tileHref = (cell.link?.trim() || artist.instagramUrl || '').trim() || '#'
                  const igEmbed = getInstagramEmbedSrc(cell.url)
                  if (igEmbed) {
                    return (
                      <div key={`${cell.url}-${i}`} className={styles.igCell}>
                        <div className={styles.igEmbedFrame}>
                          <iframe
                            src={igEmbed}
                            title={cell.kind ? `${cell.kind} on Instagram` : `Instagram ${i + 1}`}
                            loading="lazy"
                            allow="encrypted-media; picture-in-picture"
                            referrerPolicy="strict-origin-when-cross-origin"
                          />
                        </div>
                        <a
                          href={tileHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.igCellTap}
                          aria-label={cell.kind ? `Open ${cell.kind} on Instagram` : 'Open on Instagram'}
                        />
                        <div className={styles.igOverlay} aria-hidden>
                          <span className={styles.igType}>{cell.kind || 'Post'}</span>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <a
                      key={`${cell.url}-${i}`}
                      href={tileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.igCell}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getProxiedImageUrl(cell.url)}
                        alt={cell.kind ? `${cell.kind} on Instagram` : `Photo ${i + 1}`}
                        loading="lazy"
                      />
                      <div className={styles.igOverlay}>
                        <span className={styles.igType}>{cell.kind || 'Post'}</span>
                      </div>
                    </a>
                  )
                })}
              </div>
            ) : null}
            {artist.instagramUrl && !(profile.instagramShowcase && profile.instagramShowcase.length > 0) ? (
              <div className={styles.igNativeEmpty}>
                <div className={styles.igNativeEmptySilhouette} aria-hidden>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.igNativeEmptyCell} />
                  ))}
                </div>
                <p className={styles.igNativeEmptyCopy}>
                  New pieces and studio posts usually hit their feed before they land here. Open Instagram for the
                  live thread; use <strong>Works</strong> when you&apos;re ready to add art to your Street Lamp.
                </p>
                <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.btnIg}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  {artist.instagram ? `View @${artist.instagram} on Instagram` : 'View on Instagram'}
                </a>
              </div>
            ) : null}
            {artist.instagramUrl && profile.instagramShowcase && profile.instagramShowcase.length > 0 ? (
              <div className={styles.instagramCta}>
                <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.btnIg}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <rect x="2" y="2" width="20" height="20" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                  </svg>
                  {artist.instagram ? `Follow @${artist.instagram}` : 'Follow on Instagram'}
                </a>
              </div>
            ) : null}
          </div>
        </div>

        <section className={styles.relatedSection} aria-label="Related artists">
          <div className={styles.relatedHeader}>
            <div>
              <div className={styles.storyEyebrow}>Also on Street Collector</div>
              <h2 className={styles.storyH2}>
                More artists <em>to explore.</em>
              </h2>
            </div>
            <Link href="/shop/explore-artists" className={styles.navBack}>
              See all artists
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className={styles.relatedGrid}>
            {related.map((a) => (
              <button
                key={a.slug}
                type="button"
                className={styles.relatedCard}
                onClick={() => router.push(`/shop/artists/${a.slug}`)}
              >
                <div className={styles.relatedMedia}>
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.relatedImg} src={getProxiedImageUrl(a.image)} alt={a.name} loading="lazy" />
                  ) : null}
                </div>
                <div className={styles.relatedOverlay} aria-hidden />
                <div className={styles.relatedInfo}>
                  <div className={styles.relatedName}>{a.name}</div>
                  <div className={styles.relatedCity}>{a.productCount} editions</div>
                  {a.bio ? (
                    <div className={styles.relatedHook}>
                      &ldquo;{a.bio.length > 90 ? `${a.bio.slice(0, 90)}…` : a.bio}&rdquo;
                    </div>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className={styles.profileCta} aria-label="Call to action">
          <div className={styles.ctaEyebrow}>Own the work</div>
          <h2 className={styles.ctaTitle}>
            You&apos;ve met {artist.name.split(' ')[0]}.<br />
            <em>Now collect their work.</em>
          </h2>
          <p className={styles.ctaSub}>
            {stats.remainingCount} pieces left across {stats.editionCount} editions—once a run sells out here, it
            doesn&apos;t return. Add what you want to your Street Lamp while stock lasts.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/experience" className={styles.btnPrimary}>
              Add to your lamp
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/shop/explore-artists" className={styles.btnOutline}>
              Browse all artists
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
