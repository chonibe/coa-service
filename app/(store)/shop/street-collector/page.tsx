import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { StreetCollectorBrandJsonLd } from '@/components/seo/StreetCollectorBrandJsonLd'
import { Container } from '@/components/impact'
import { landingFontVariables } from '../home-v2/landing-fonts'
import landingStyles from '../home-v2/landing.module.css'
import exploreStyles from '../explore-artists/explore-artists.module.css'
import scStyles from './collector-store.module.css'
import { streetCollectorContent } from '@/content/street-collector'
import {
  getCollection,
  getCollectionWithListProducts,
  getProduct,
  isStorefrontConfigured,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getArtistImageByHandle } from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import { CollectorStoreTopChrome } from '@/components/shop/CollectorStoreTopChrome'
import { CollectorHomeArtistRoster } from './CollectorHomeArtistRoster'
import { UpcomingDropCountdown } from './UpcomingDropCountdown'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { queryEditionStatesByProductIds } from '@/lib/shop/query-edition-states'
import { mergeEditionStateWithStorefront } from '@/lib/shop/merge-collector-edition-state'
import {
  ladderStageBadgeClass,
  ladderStageColumnClass,
  ladderStageShortLabel,
} from '@/lib/shop/collector-ladder-styles'
import { getStreetLampProductHandle, streetLampProductPath } from '@/lib/shop/street-lamp-handle'
import { collectorStoreChromePaddingTopClass } from '@/lib/shop/collector-store-chrome-layout'

const StreetCollectorFAQ = dynamic(
  () => import('./StreetCollectorFAQ').then((m) => ({ default: m.StreetCollectorFAQ })),
  { loading: () => <section className="min-h-[120px] bg-[#faf6f2] dark:bg-[#171515]" aria-hidden /> }
)

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'Street Collector — limited edition street art drops & artist roster',
  description:
    'Collect the street artists you love before everyone else does. Limited editions, transparent ladder pricing, new drops weekly — plus The Reserve for early access.',
  alternates: { canonical: '/shop/street-collector' },
  openGraph: {
    title: 'Street Collector — drops, artists, and collecting',
    description:
      'Limited edition prints from independent street artists. Prices climb as editions sell through. Follow artists and shop live drops.',
    url: '/shop/street-collector',
    siteName: 'Street Collector',
    type: 'website',
  },
}

export const revalidate = 60

function nextThursdayUtcNoonIso(): string {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0))
  const day = d.getUTCDay()
  let add = (4 - day + 7) % 7
  if (add === 0 && now.getTime() > d.getTime()) add = 7
  d.setUTCDate(d.getUTCDate() + add)
  return d.toISOString()
}

const HOME_LADDER_DISPLAY = [
  { key: 'ground_floor' as const, price: '$40' },
  { key: 'rising' as const, price: '$50' },
  { key: 'established' as const, price: '$62' },
  { key: 'final' as const, price: '$75' },
  { key: 'archive' as const, price: '—' },
]

export default async function StreetCollectorPage() {
  const apiConfigured = isStorefrontConfigured()
  let apiError: string | null = null

  type FeaturedHomeArtist = {
    handle: string
    name: string
    location?: string
    imageUrl?: string
    description?: string
    collectionHref?: string
  }
  let featuredArtists: FeaturedHomeArtist[] = []

  let spotlightProducts: ShopifyProduct[] = []
  let lampTeaserImageUrl: string | undefined

  const SEASON_2_HANDLE = '2025-edition'

  if (apiConfigured) {
    try {
      const [featuredArtistsResult, season2Col, lampProduct] = await Promise.all([
        Promise.all(
          streetCollectorContent.featuredArtists.collections.map(async (artist) => {
            const collectionHref =
              'collectionHref' in artist && typeof artist.collectionHref === 'string'
                ? artist.collectionHref
                : undefined
            const location = 'location' in artist && typeof artist.location === 'string' ? artist.location : undefined
            try {
              const col = await getCollection(artist.handle, { first: 1 }).catch(() => null)
              const handleForName = artist.handle.replace(/-\d+$/, '')
              const fallbackName = handleForName
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')
              const name = col?.title?.trim() || fallbackName
              let description: string | undefined =
                col?.description
                  ? col.description
                  : col?.descriptionHtml
                    ? col.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                    : undefined
              if (!description) {
                const vendorBio = await getVendorBioByHandle(artist.handle)
                description = vendorBio?.bio
              }
              let imageUrl = col?.image?.url || col?.products?.edges?.[0]?.node?.featuredImage?.url
              if (!imageUrl) {
                imageUrl = await getArtistImageByHandle(artist.handle)
              }
              return {
                handle: artist.handle,
                name,
                location,
                imageUrl,
                description,
                collectionHref,
              }
            } catch {
              const handleForName = artist.handle.replace(/-\d+$/, '')
              const imageUrl = await getArtistImageByHandle(artist.handle)
              return {
                handle: artist.handle,
                name: handleForName
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' '),
                location,
                imageUrl,
                description: undefined,
                collectionHref,
              }
            }
          })
        ),
        getCollectionWithListProducts(SEASON_2_HANDLE, {
          first: 100,
          sortKey: 'MANUAL',
        }).catch(() => null),
        getProduct(getStreetLampProductHandle()).catch(() => null),
      ])
      featuredArtists = featuredArtistsResult
      lampTeaserImageUrl = lampProduct?.featuredImage?.url ?? undefined

      const existingHandles = new Set(
        featuredArtists.map((a) => a.handle.replace(/-\d+$/, '').toLowerCase())
      )
      const season2Products = season2Col?.products?.edges?.map((e) => e.node) ?? []
      const lampHc = getStreetLampProductHandle().toLowerCase()
      spotlightProducts = season2Products
        .filter(
          (p) =>
            p.handle &&
            p.handle.toLowerCase() !== lampHc &&
            !p.handle.toLowerCase().startsWith('street-lamp')
        )
        .slice(0, 2)

      const vendorsBySlug = new Map<string, string>()
      for (const p of season2Products) {
        if (p.vendor?.trim()) {
          const slug = p.vendor
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
          if (slug && !existingHandles.has(slug)) {
            vendorsBySlug.set(slug, p.vendor)
          }
        }
      }
      const season2Artists = await Promise.all(
        Array.from(vendorsBySlug.entries()).map(async ([slug, vendorName]) => {
          const col = await getCollection(slug, { first: 1 }).catch(() => null)
          const colAlt = col ?? (await getCollection(`${slug}-1`, { first: 1 }).catch(() => null))
          const c = col ?? colAlt
          const handle = c ? (col ? slug : `${slug}-1`) : slug
          let description: string | undefined =
            c?.description
              ? c.description
              : c?.descriptionHtml
                ? c.descriptionHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                : undefined
          if (!description) {
            const vendorBio = await getVendorBioByHandle(handle)
            description = vendorBio?.bio
          }
          let imageUrl = c?.image?.url || c?.products?.edges?.[0]?.node?.featuredImage?.url
          if (!imageUrl) {
            imageUrl = await getArtistImageByHandle(handle)
          }
          return {
            handle,
            name: c?.title?.trim() || vendorName,
            location: undefined as string | undefined,
            imageUrl,
            description,
          }
        })
      )
      const HIDDEN_HANDLES = new Set(['khwampa', 'khwampah'])
      const isHidden = (a: { handle: string; name: string }) =>
        HIDDEN_HANDLES.has(a.handle.replace(/-\d+$/, '').toLowerCase()) ||
        HIDDEN_HANDLES.has(a.name.toLowerCase())
      const richness = (a: { imageUrl?: string; description?: string }) =>
        (a.imageUrl ? 1 : 0) + (a.description ? 1 : 0)
      const nameToArtist = new Map<string, FeaturedHomeArtist>()
      for (const a of season2Artists.filter((a) => a.name && !isHidden({ handle: a.handle, name: a.name }))) {
        const key = a.name.toLowerCase().trim()
        const existing = nameToArtist.get(key)
        if (!existing || richness(a) > richness(existing)) {
          nameToArtist.set(key, a)
        }
      }
      for (const a of featuredArtists) {
        if (isHidden(a)) continue
        const key = a.name.toLowerCase().trim()
        const existing = nameToArtist.get(key)
        if (!existing || richness(a) > richness(existing)) {
          nameToArtist.set(key, a)
        } else if (a.collectionHref) {
          nameToArtist.set(key, { ...existing, collectionHref: a.collectionHref })
        }
      }
      featuredArtists = Array.from(nameToArtist.values())
      const leadHandle = 'jerome-masi'
      const leadIdx = featuredArtists.findIndex(
        (a) => a.handle.replace(/-\d+$/, '').toLowerCase() === leadHandle
      )
      if (leadIdx > 0) {
        const [lead] = featuredArtists.splice(leadIdx, 1)
        featuredArtists.unshift(lead)
      }
    } catch (error: unknown) {
      console.error('Street Collector page API error:', error instanceof Error ? error.message : error)
      apiError = error instanceof Error ? error.message : 'Unknown error'
    }
  } else {
    apiError = 'Shopify Storefront API not configured.'
  }

  const upcomingIso = nextThursdayUtcNoonIso()

  const spotlightIds = spotlightProducts
    .map((p) => normalizeShopifyProductId(p.id))
    .filter((x): x is string => Boolean(x))
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n))

  const editionRows = spotlightIds.length
    ? await queryEditionStatesByProductIds(spotlightIds)
    : []
  const editionByProductId = new Map(editionRows.map((r) => [r.productId, r]))

  const debraQuote =
    streetCollectorContent.testimonials.quotes.find((q) => q.author === 'Debra G.')?.content ??
    streetCollectorContent.testimonials.quotes[0]?.content ??
    ''

  return (
    <div className={cn(landingFontVariables, landingStyles.page, 'pb-24 md:pb-8')}>
      <StreetCollectorBrandJsonLd />
      <CollectorStoreTopChrome />

      <div className={collectorStoreChromePaddingTopClass} />

      {apiError && process.env.NODE_ENV === 'development' && (
        <div className="border-b border-amber-700/50 bg-amber-900/30 px-4 py-3">
          <Container maxWidth="default" paddingX="gutter">
            <p className="text-sm text-amber-200">{apiError}</p>
          </Container>
        </div>
      )}

      <div className={exploreStyles.wrap}>
        <section className={cn(exploreStyles.hero, scStyles.heroShop)} aria-label="Street Collector home">
          <div className={exploreStyles.heroBgGradient} aria-hidden />
          <div className={exploreStyles.heroContent}>
            <div className={exploreStyles.heroEyebrow}>Limited editions · 85+ artists · New drops weekly</div>
            <h1 className={exploreStyles.heroH1}>
              Collect the artists you love before <em>everyone else.</em>
            </h1>
            <p className={exploreStyles.heroDesc}>
              Limited edition prints from artists around the world. Prices only go up. When editions sell out,
              they&apos;re gone. Follow the artists you care about and get first access when they drop.
            </p>
            <div className={cn(scStyles.heroCtas, 'flex flex-wrap gap-4')}>
              <Link href="/shop/artists" prefetch={false} className={landingStyles.btnPrimary}>
                Browse artists
              </Link>
              <Link href="/shop/drops" prefetch={false} className={landingStyles.btnOutline}>
                See upcoming drops
              </Link>
            </div>
          </div>
        </section>

        <section className={exploreStyles.artistsSection} aria-label="This week&apos;s drops">
          <div className={exploreStyles.artistsHeader}>
            <div>
              <div className={exploreStyles.eyebrowInline}>On the calendar</div>
              <h2 className={exploreStyles.featuredTitle}>
                This week&apos;s <em>drops</em>
              </h2>
            </div>
            <Link
              href="/shop/drops"
              prefetch={false}
              className={cn(exploreStyles.artistsHeaderNote, 'transition-colors hover:text-white')}
            >
              View all →
            </Link>
          </div>

          <div className={scStyles.dropsGrid3}>
            {spotlightProducts.map((p) => {
              const pid = normalizeShopifyProductId(p.id) || ''
              const row = editionByProductId.get(pid)
              const merged = mergeEditionStateWithStorefront(p, row)
              const img = p.featuredImage?.url
              const sold = merged.editionsSold
              const total = merged.editionTotal
              const price = merged.priceUsd
              const stageKey = merged.stageKey
              return (
                <article key={p.id} className={exploreStyles.artistCard}>
                  <div className={exploreStyles.artistCardInner}>
                    <Link
                      href={`/shop/${encodeURIComponent(p.handle)}`}
                      prefetch={false}
                      className={exploreStyles.artistCardMediaButton}
                      aria-label={`Open ${p.title}`}
                    >
                      <div className={exploreStyles.artistCardMedia}>
                        {img ? (
                          <Image
                            className={exploreStyles.artistCardImg}
                            src={getProxiedImageUrl(img)}
                            alt=""
                            fill
                            sizes="(max-width:768px) 100vw, 33vw"
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
                            {(p.vendor || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={exploreStyles.artistCardOverlay} aria-hidden />
                        <div className={exploreStyles.artistCardInfo}>
                          <div className={exploreStyles.artistCardName}>{p.vendor || 'Artist'}</div>
                          <div className={exploreStyles.artistCardCity}>
                            Live · {ladderStageShortLabel(stageKey)}
                          </div>
                          <div className={exploreStyles.artistCardHook}>{p.title}</div>
                        </div>
                      </div>
                    </Link>
                    <div className={exploreStyles.artistCardFooter}>
                      <div className={exploreStyles.editionsCount}>
                        <span className="tabular-nums">{price != null ? `$${price}` : '—'}</span>
                        {total != null ? (
                          <span className="tabular-nums">
                            {sold} / {total} sold
                          </span>
                        ) : null}
                      </div>
                      <span className={exploreStyles.cardExploreLink} aria-hidden>
                        Shop
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
            {spotlightProducts.length < 2 &&
              [0, 1].slice(spotlightProducts.length).map((i) => (
                <article key={`ph-${i}`} className={exploreStyles.artistCard}>
                  <div className={exploreStyles.artistCardInner}>
                    <div className={exploreStyles.artistCardMedia}>
                      <div
                        className="flex h-full min-h-[200px] w-full items-center justify-center text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        More drops loading soon.
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            <article className={exploreStyles.artistCard}>
              <div className={exploreStyles.artistCardInner}>
                <div className={exploreStyles.artistCardMedia}>
                  <div
                    className="flex h-full min-h-[200px] w-full flex-col items-center justify-center gap-2 px-4 text-center"
                    style={{ background: 'var(--card2)', color: 'var(--muted)' }}
                  >
                    <span className="text-[10px] uppercase tracking-wide text-[#c98a7a]">Drops Thursday</span>
                    <span className="text-xs">Upcoming edition</span>
                  </div>
                  <div className={exploreStyles.artistCardOverlay} aria-hidden />
                  <div className={exploreStyles.artistCardInfo}>
                    <div className={exploreStyles.artistCardName}>Next on the calendar</div>
                    <div className={exploreStyles.artistCardCity}>Ground floor from $40</div>
                  </div>
                </div>
                <div className={exploreStyles.artistCardFooter}>
                  <div className={exploreStyles.editionsCount}>
                    <span>From $40</span>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <UpcomingDropCountdown targetIso={upcomingIso} notifyHref="/shop/reserve" />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={exploreStyles.philosophy} aria-label="How pricing works">
          <div className={exploreStyles.philosophyInner}>
            <div className={exploreStyles.philosophyEyebrow}>Ladder pricing</div>
            <p className={exploreStyles.philosophyQuote}>
              Prices only go up. Editions are finite. When they&apos;re gone, they&apos;re <em>gone.</em>
            </p>
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-5 gap-1.5 sm:gap-2">
              {HOME_LADDER_DISPLAY.map((step) => (
                <div
                  key={step.key}
                  className={cn(
                    'rounded-lg px-1 py-2.5 text-center sm:px-2 sm:py-3',
                    ladderStageColumnClass(step.key)
                  )}
                >
                  <div className="text-[9px] font-medium uppercase opacity-90 sm:text-[10px]">
                    {ladderStageShortLabel(step.key)}
                  </div>
                  <div className="mt-1 text-sm font-medium tabular-nums sm:text-base">{step.price}</div>
                </div>
              ))}
            </div>
            <p className={exploreStyles.philosophyBody}>
              Every edition climbs as it sells through. Early collectors pay ground floor. Late collectors may not get
              in at all.
            </p>
          </div>
        </section>

        <section className={exploreStyles.featuredSection} aria-label="The Reserve">
          <div className={exploreStyles.featuredHeader}>
            <div>
              <div className={exploreStyles.eyebrowInline}>Membership</div>
              <h2 className={exploreStyles.featuredTitle}>
                The <em>Reserve</em>
              </h2>
            </div>
          </div>
          <div className="mx-auto max-w-2xl px-6 pb-20 text-center sm:px-10">
            <p className={exploreStyles.philosophyBody}>
              Never miss an artist you love. When they drop, you get 48-hour early access, ground-floor priority, and
              monthly credit that rolls into your next purchase.
            </p>
            <ul
              className="mx-auto mb-8 mt-6 max-w-md space-y-2 text-left text-sm"
              style={{ color: 'var(--muted)', fontFamily: 'var(--font-landing-mono), monospace' }}
            >
              <li>48h early access</li>
              <li>Priority allocation</li>
              <li>$20/mo drop credit</li>
              <li>Ground-floor price lock</li>
            </ul>
            <Link href="/shop/reserve" prefetch={false} className={exploreStyles.btnFeatured}>
              Join the Reserve
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>

        {featuredArtists.length > 0 ? (
          <section className={exploreStyles.artistsSection} aria-label="Follow your artists">
            <div className={exploreStyles.artistsHeader}>
              <div>
                <div className={exploreStyles.eyebrowInline}>Your roster</div>
                <h2 className={exploreStyles.featuredTitle}>
                  Follow your <em>artists</em>
                </h2>
              </div>
              <Link
                href="/shop/artists"
                prefetch={false}
                className={cn(exploreStyles.artistsHeaderNote, 'transition-colors hover:text-white')}
              >
                View directory →
              </Link>
            </div>
            <CollectorHomeArtistRoster artists={featuredArtists} />
          </section>
        ) : null}

        <section className={scStyles.lampRow} aria-label="Street Lamp">
          <div className={exploreStyles.eyebrowInline}>The display your collection lives on</div>
          <div className="mt-4 flex flex-wrap items-start gap-6">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden" style={{ background: 'var(--card2)' }}>
              {lampTeaserImageUrl ? (
                <Image
                  src={getProxiedImageUrl(lampTeaserImageUrl)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={exploreStyles.featuredName} style={{ fontSize: 22 }}>
                Street Collector lamp
              </h3>
              <p className={exploreStyles.featuredBio}>
                Backlit, swappable prints — the infrastructure that makes your collection visible at home.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className={exploreStyles.statN} style={{ fontSize: 28 }}>
                  $149
                </span>
                <Link href={streetLampProductPath()} prefetch={false} className={exploreStyles.lbCtaOutline}>
                  Shop the lamp
                </Link>
              </div>
            </div>
          </div>
        </section>

        {debraQuote ? (
          <div className={scStyles.testimonialBlock}>
            <blockquote className={scStyles.pullquote}>“{debraQuote}”</blockquote>
            <p className={scStyles.attribution}>— Debra G., Street Collector collector</p>
          </div>
        ) : null}

        <StreetCollectorFAQ
          title={streetCollectorContent.faq.title}
          groups={streetCollectorContent.faq.groups}
          layout="immersive"
        />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link href="/shop/artists" prefetch={false} className={cn(landingStyles.btnPrimary, 'w-full max-w-md justify-center')}>
          Browse artists
        </Link>
      </div>
    </div>
  )
}
