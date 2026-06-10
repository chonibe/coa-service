'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { getInstagramEmbedSrc } from '@/lib/shop/instagram-embed'
import { formatPrice, type ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { ArtistProfileApiResponse, InstagramProfileSummary } from '@/lib/shop/artist-profile-api'
import { buildArtistAnswerFirstLead } from '@/lib/seo/artist-meta'
import { buildArtistFaqPairs } from '@/lib/seo/artist-faqs'
import { parsePullQuote } from '@/lib/shop/parse-pull-quote'
import { useCart } from '@/lib/shop/CartContext'
import { trackAddToCart } from '@/lib/google-analytics'
import { storefrontProductToItem } from '@/lib/analytics-ecommerce'
import styles from './artist-profile.module.css'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import { MobileStickyCta } from '@/components/shop/MobileStickyCta'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import {
  ladderStageBadgeClass,
  ladderStageShortLabel,
} from '@/lib/shop/collector-ladder-styles'
import type { StreetPricingStageKey } from '@/lib/shop/street-collector-pricing-stages'

type TabId = 'overview' | 'works' | 'exhibitions'

type WorkFilter = 'all' | 'available' | 'sold' | string

type ListArtist = {
  name: string
  slug: string
  bio?: string
  image?: string
  productCount: number
}

function editionLabel(product: ShopifyProduct): string | undefined {
  const row = product.metafields?.find(
    (m) => m != null && m.namespace === 'custom' && m.key === 'edition_size'
  )
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

type EditionStateLite = {
  stageKey: StreetPricingStageKey
  priceUsd: number | null
  editionsSold: number
  editionTotal: number | null
}

type Props = {
  artist: ArtistProfileApiResponse
  earlyAccessCoupon?: string | null
  /** Compact layout for embedding inside another surface (e.g. experience v3). */
  embedded?: boolean
}

function formatCompactCount(value: number | undefined): string | null {
  if (!Number.isFinite(value)) return null
  const n = value as number
  if (n >= 1000000) return `${(n / 1000000).toFixed(n >= 10000000 ? 0 : 1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K`
  return `${n}`
}

export function ArtistProfilePageClient({ artist, embedded = false }: Props) {
  const router = useRouter()
  const cart = useCart()
  const [tab, setTab] = React.useState<TabId>('overview')
  const [workFilter, setWorkFilter] = React.useState<WorkFilter>('all')
  const [related, setRelated] = React.useState<ListArtist[]>([])
  const [editionByProductId, setEditionByProductId] = React.useState<
    Record<string, EditionStateLite>
  >({})

  const profile = artist.profile ?? {}
  const stats = artist.stats ?? { editionCount: artist.products.length, remainingCount: 0 }
  const [instagramProfile, setInstagramProfile] = React.useState<InstagramProfileSummary | undefined>(
    profile.instagramProfile
  )
  const instagramHandle = instagramProfile?.handle || artist.instagram || null
  const instagramProfileUrl = artist.instagramUrl || (instagramHandle ? `https://www.instagram.com/${instagramHandle}/` : null)

  React.useEffect(() => {
    const handle = instagramHandle?.trim()
    if (!handle) return
    if (
      instagramProfile?.followersCount &&
      instagramProfile?.followsCount &&
      instagramProfile?.mediaCount &&
      instagramProfile?.avatarUrl
    ) {
      return
    }
    let cancelled = false
    fetch(`/api/shop/instagram-profile?handle=${encodeURIComponent(handle)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { profile?: InstagramProfileSummary } | null) => {
        if (cancelled || !data?.profile) return
        setInstagramProfile((prev) => ({
          ...(prev || {}),
          ...data.profile,
        }))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [
    instagramHandle,
    instagramProfile?.avatarUrl,
    instagramProfile?.followersCount,
    instagramProfile?.followsCount,
    instagramProfile?.mediaCount,
  ])

  React.useEffect(() => {
    const ids = artist.products
      .map((p) => normalizeShopifyProductId(p.id))
      .filter((x): x is string => Boolean(x))
    if (ids.length === 0) return
    const q = ids.slice(0, 80).join(',')
    let cancelled = false
    fetch(`/api/shop/edition-states?ids=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data: { items?: Array<EditionStateLite & { productId: string }> }) => {
        if (cancelled) return
        const items = data.items || []
        const map: Record<string, EditionStateLite> = {}
        for (const row of items) {
          if (row.productId) {
            map[row.productId] = {
              stageKey: row.stageKey,
              priceUsd: row.priceUsd,
              editionsSold: row.editionsSold,
              editionTotal: row.editionTotal,
            }
          }
        }
        setEditionByProductId(map)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [artist.products])

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

  const dropHistorySorted = React.useMemo(() => {
    return [...artist.products].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
      return tb - ta
    })
  }, [artist.products])

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
    .join(' Â· ')

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
    <div className={cn(styles.root, embedded && styles.rootEmbedded)}>
      <div className={styles.inner}>
        {!embedded ? <CollectorStoreTopChrome /> : null}

        <section
          className={cn(styles.profileHero, embedded && styles.profileHeroEmbedded)}
          aria-label="Artist hero"
        >
          <div className={styles.heroCanvasCol}>
            <div className={styles.heroGradient} aria-hidden />
            <div className={styles.heroPortrait}>
              {heroImage ? (
                <Image
                  src={getProxiedImageUrl(heroImage)}
                  alt={artist.name}
                  fill
                  sizes="(max-width: 960px) 100vw, 50vw"
                  priority
                  style={{ objectFit: 'cover' }}
                />
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
              <span className={styles.badgeLabel}>Works</span>
              <span className={styles.badgeVal}>
                {stats.editionCount} {stats.editionCount === 1 ? 'work' : 'works'}
              </span>
            </div>
          </div>
          <div className={styles.heroContentCol}>
            {eyebrow ? <div className={styles.heroEyebrow}>{eyebrow}</div> : null}
            <h1 className={styles.heroName}>{artist.name}</h1>
            <p className={styles.heroLead}>{buildArtistAnswerFirstLead(artist)}</p>
            {profile.alias ? <div className={styles.heroAlias}>{profile.alias}</div> : null}
            {profile.storyHook ? <p className={styles.heroHook}>&ldquo;{profile.storyHook}&rdquo;</p> : null}
            <div className={styles.heroMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaVal}>{stats.editionCount}</span>
                <span className={styles.metaLabel}>Works</span>
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
                    We&apos;re still building this profile. Check back soon for a fuller artist biography and studio context.
                  </p>
                )}
                {profile.pullquote ? (() => {
                  const parsed = parsePullQuote(profile.pullquote)
                  if (!parsed) return null
                  return (
                    <blockquote className={styles.storyPullquote}>
                      <p className={styles.storyPullquoteBody}>&ldquo;{parsed.quote}&rdquo;</p>
                      {parsed.attribution ? (
                        <cite className={styles.storyPullquoteCite}>{parsed.attribution}</cite>
                      ) : null}
                    </blockquote>
                  )
                })() : null}
                {profile.impactCallout ? (
                  <div className={styles.bioCard}>
                    <div className={styles.bioCardIcon} aria-hidden>
                      â†’
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
                    Studio shots, work in progress, and detail images will appear here as this profile develops.
                  </p>
                )}
                {profile.exclusiveCallout ? (
                  <div className={styles.bioCard} style={{ marginTop: 'auto' }}>
                    <div className={styles.bioCardIcon} style={{ fontSize: 14 }} aria-hidden>
                      âœ¦
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
            {instagramProfileUrl ? (
              <section className={styles.profileLinkSection} aria-labelledby="artist-instagram-heading">
                <div className={styles.profileLinkCard}>
                  <div className={styles.profileLinkHeader}>
                    <div className={styles.storyEyebrow}>Instagram</div>
                    <h2 id="artist-instagram-heading" className={styles.storyH2}>
                      The artist&apos;s <em>profile.</em>
                    </h2>
                  </div>
                  <div
                    className={styles.instagramProfileCard}
                    role="link"
                    tabIndex={0}
                    onClick={() => {
                      if (instagramProfileUrl) window.open(instagramProfileUrl, '_blank', 'noopener,noreferrer')
                    }}
                    onKeyDown={(event) => {
                      if (!instagramProfileUrl) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        window.open(instagramProfileUrl, '_blank', 'noopener,noreferrer')
                      }
                    }}
                  >
                    <a
                      href={instagramProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.instagramProfileAvatar}
                      aria-label={artist.instagram ? `Open @${artist.instagram} on Instagram` : `Open ${artist.name} on Instagram`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {instagramProfile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getProxiedImageUrl(instagramProfile.avatarUrl)} alt={artist.name} loading="lazy" />
                      ) : heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={getProxiedImageUrl(heroImage)} alt={artist.name} loading="lazy" />
                      ) : (
                        <span>{(artist.name[0] || '?').toUpperCase()}</span>
                      )}
                    </a>
                    <div className={styles.instagramProfileMain}>
                      <div className={styles.instagramProfileTop}>
                        <div>
                          <div className={styles.instagramProfileName}>
                            {instagramProfile?.displayName || artist.name}
                          </div>
                          {instagramHandle ? (
                            <div className={styles.instagramProfileHandle}>@{instagramHandle}</div>
                          ) : null}
                        </div>
                        <a
                          href={instagramProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.btnIg}
                          onClick={(event) => event.stopPropagation()}
                        >
                          Open profile
                        </a>
                      </div>
                      {instagramProfile?.biography ? (
                        <p className={styles.storyBody}>{instagramProfile.biography}</p>
                      ) : (
                        <p className={styles.storyBody}>
                          Visit Instagram for recent posts, studio updates, and work that sits outside this profile.
                        </p>
                      )}
                      <div className={styles.instagramProfileStats}>
                        {formatCompactCount(instagramProfile?.followersCount) ? (
                          <div className={styles.instagramStat}>
                            <strong>{formatCompactCount(instagramProfile?.followersCount)}</strong>
                            <span>followers</span>
                          </div>
                        ) : null}
                        {formatCompactCount(instagramProfile?.followsCount) ? (
                          <div className={styles.instagramStat}>
                            <strong>{formatCompactCount(instagramProfile?.followsCount)}</strong>
                            <span>following</span>
                          </div>
                        ) : null}
                        {formatCompactCount(instagramProfile?.mediaCount) ? (
                          <div className={styles.instagramStat}>
                            <strong>{formatCompactCount(instagramProfile?.mediaCount)}</strong>
                            <span>posts</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}
            <section className={styles.faqSection} aria-labelledby="artist-faq-heading">
              <h2 id="artist-faq-heading" className={styles.faqH2}>
                Common questions
              </h2>
              <dl className={styles.faqList}>
                {buildArtistFaqPairs(artist).map((f) => (
                  <div key={f.question} className={styles.faqItem}>
                    <dt className={styles.faqQ}>{f.question}</dt>
                    <dd className={styles.faqA}>{f.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>

        <div className={cn(styles.tabPanel, tab === 'works' && styles.tabPanelActive)} role="tabpanel" hidden={tab !== 'works'}>
          <div className={styles.worksSection}>
            <div className={styles.worksHeader}>
              <div>
                <div className={styles.storyEyebrow} style={{ marginBottom: 10 }}>
                  Works
                </div>
                <h2 className={styles.storyH2} style={{ marginBottom: 0 }}>
                  {stats.editionCount} {stats.editionCount === 1 ? 'work' : 'works'}
                </h2>
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 260, lineHeight: 1.7, textAlign: 'right' }}>
                A selection of works by {artist.name}.
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
                const pid = normalizeShopifyProductId(product.id) || ''
                const st = editionByProductId[pid]
                const pct =
                  st?.editionTotal && st.editionTotal > 0
                    ? Math.min(100, Math.round((st.editionsSold / st.editionTotal) * 100))
                    : 0
                return (
                  <div key={product.id} className={cn(styles.workItem, !product.availableForSale && styles.workSoldOut)}>
                    <Link href={`/shop/${product.handle}`} className={styles.workMedia}>
                      {product.featuredImage?.url ? (
                        <Image
                          className={styles.workImg}
                          src={getProxiedImageUrl(product.featuredImage.url)}
                          alt={product.featuredImage.altText || product.title}
                          fill
                          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"
                          loading="lazy"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : null}
                      <div className={styles.workOverlay} aria-hidden />
                      {ed ? <div className={styles.workEdition}>{ed}</div> : null}
                      {!product.availableForSale ? <div className={styles.workSold}>Sold Out</div> : null}
                    </Link>
                    <div className={styles.workInfo}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className={styles.workTitle}>{product.title}</div>
                        {st ? (
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                              ladderStageBadgeClass(st.stageKey)
                            )}
                          >
                            {ladderStageShortLabel(st.stageKey)}
                          </span>
                        ) : null}
                      </div>
                      {st?.editionTotal ? (
                        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      ) : null}
                      <div className={styles.workYear}>{[season].filter(Boolean).join(' Â· ')}</div>
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
            <section className="mt-10 border-t border-white/10 pt-8" aria-labelledby="drop-history-heading">
              <h3
                id="drop-history-heading"
                className="mb-4 text-xs font-medium uppercase tracking-wide text-[#FFBA94]/60"
              >
                Drop history
              </h3>
              <ul className="space-y-3">
                {dropHistorySorted.map((p) => {
                  const pid = normalizeShopifyProductId(p.id) || ''
                  const st = editionByProductId[pid]
                  const when = p.updatedAt
                    ? new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                    : 'â€”'
                  const status =
                    st?.stageKey === 'archive' || !p.availableForSale
                      ? 'Sold out'
                      : st
                        ? `${ladderStageShortLabel(st.stageKey)} Â· ${st.editionsSold}/${st.editionTotal ?? 'â€”'} sold`
                        : p.availableForSale
                          ? 'Available'
                          : 'Sold out'
                  return (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-sm text-[#FFBA94]/90 last:border-0"
                    >
                      <span>
                        <span className="text-[#FFBA94]/55">{when}</span>
                        {' Â· '}
                        {p.title}
                      </span>
                      <span className="text-xs text-[#FFBA94]/65">{status}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
            {filteredProducts.length === 0 ? (
              <p className={styles.mutedNote}>Nothing matches this filterâ€”try All Works or another season.</p>
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
                  when it&apos;s publishedâ€”newest year first.
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
                      {card.year ? ` Â· ${card.year}` : ''}
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

        <section className={styles.relatedSection} aria-label="Related artists">
          <div className={styles.relatedHeader}>
            <div>
              <div className={styles.storyEyebrow}>Also on Street Collector</div>
              <h2 className={styles.storyH2}>
                More artists <em>to explore.</em>
              </h2>
            </div>

          </div>
          <div className={styles.relatedGrid}>
            {related.map((a) => (
              <button
                key={a.slug}
                type="button"
                className={styles.relatedCard}
                onClick={() => router.push(`/shop/artists/${a.slug}`)}
              >
                <div className={styles.relatedMedia} style={{ position: 'relative' }}>
                  {a.image ? (
                    <Image
                      className={styles.relatedImg}
                      src={getProxiedImageUrl(a.image)}
                      alt={a.name}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 220px"
                      loading="lazy"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : null}
                </div>
                <div className={styles.relatedOverlay} aria-hidden />
                <div className={styles.relatedInfo}>
                  <div className={styles.relatedName}>{a.name}</div>
                  <div className={styles.relatedCity}>{a.productCount} editions</div>
                  {a.bio ? (
                    <div className={styles.relatedHook}>
                      &ldquo;{a.bio.length > 90 ? `${a.bio.slice(0, 90)}â€¦` : a.bio}&rdquo;
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
          </div>
        </section>
      </div>
      {!embedded ? (
        <MobileStickyCta href="/experience" label={`Collect ${artist.name}`} />
      ) : null}
    </div>
  )
}
