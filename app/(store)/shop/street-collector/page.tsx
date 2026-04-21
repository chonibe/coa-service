import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { StreetCollectorBrandJsonLd } from '@/components/seo/StreetCollectorBrandJsonLd'
import { Container, SectionWrapper } from '@/components/impact'
import { streetCollectorContent } from '@/content/street-collector'
import {
  getCollection,
  getCollectionWithListProducts,
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
import {
  ladderStageBadgeClass,
  ladderStageColumnClass,
  ladderStageShortLabel,
} from '@/lib/shop/collector-ladder-styles'
import { getStreetLampProductHandle, streetLampProductPath } from '@/lib/shop/street-lamp-handle'

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

  let featuredArtists: Array<{
    handle: string
    name: string
    location?: string
    imageUrl?: string
    description?: string
  }> = []

  let spotlightProducts: ShopifyProduct[] = []

  const SEASON_2_HANDLE = '2025-edition'

  if (apiConfigured) {
    try {
      const [featuredArtistsResult, season2Col] = await Promise.all([
        Promise.all(
          streetCollectorContent.featuredArtists.collections.map(async (artist) => {
            const collectionHref = 'collectionHref' in artist ? (artist as { collectionHref?: string }).collectionHref : undefined
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
                location: artist.location,
                imageUrl,
                description,
                href: collectionHref,
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
                location: artist.location,
                imageUrl,
                description: undefined,
                href: collectionHref,
              }
            }
          })
        ),
        getCollectionWithListProducts(SEASON_2_HANDLE, {
          first: 100,
          sortKey: 'MANUAL',
        }).catch(() => null),
      ])
      featuredArtists = featuredArtistsResult

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
      const nameToArtist = new Map<string, (typeof featuredArtists)[0]>()
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
        const aWithHref = 'href' in a ? a : undefined
        if (!existing || richness(a) > richness(existing)) {
          nameToArtist.set(key, a)
        } else if (aWithHref?.href) {
          nameToArtist.set(key, { ...existing, href: aWithHref.href })
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

  const trustPromoLine = streetCollectorContent.meetTheLamp.trustMicroItems.join(' · ')
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
    <div className="w-full pb-24 text-stone-900 dark:text-[#FFBA94] md:pb-8">
      <StreetCollectorBrandJsonLd />
      <CollectorStoreTopChrome promoLine={trustPromoLine} />

      <div className="pt-[calc(6.25rem+env(safe-area-inset-top,0px))] md:pt-[calc(6.75rem+env(safe-area-inset-top,0px))]" />

      {apiError && process.env.NODE_ENV === 'development' && (
        <div className="border-b border-amber-700/50 bg-amber-900/30 px-4 py-3">
          <Container maxWidth="default" paddingX="gutter">
            <p className="text-sm text-amber-200">{apiError}</p>
          </Container>
        </div>
      )}

      <SectionWrapper spacing="md" background="experience" className="!pt-4 !pb-10">
        <Container maxWidth="default" paddingX="gutter">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500 dark:text-[#FFBA94]/65">
            Limited editions · 85+ artists · New drops weekly
          </p>
          <h1 className="max-w-xl font-serif text-3xl font-medium leading-[1.12] tracking-tight text-stone-900 dark:text-[#FFBA94] sm:text-4xl md:text-[2.125rem] md:leading-tight">
            Collect the street artists you love. Before everyone else does.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-stone-600 dark:text-[#FFBA94]/80">
            Limited edition prints from artists around the world. Prices only go up. When editions sell out,
            they&apos;re gone. Follow the artists you care about and get first access when they drop.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/shop/artists"
              prefetch={false}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 dark:bg-[#FFBA94] dark:text-[#171515]"
            >
              Browse artists
            </Link>
            <Link
              href="/shop/drops"
              prefetch={false}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-stone-300 bg-transparent px-5 py-2.5 text-sm font-medium text-stone-900 transition-colors hover:bg-stone-50 dark:border-white/20 dark:text-[#FFBA94] dark:hover:bg-white/5"
            >
              See upcoming drops
            </Link>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="md" background="default" className="!pt-2 !pb-10">
        <Container maxWidth="default" paddingX="gutter">
          <div className="mb-3 flex items-baseline justify-between gap-4 px-1">
            <h2 className="text-lg font-medium text-stone-900 dark:text-[#FFBA94]">This week&apos;s drops</h2>
            <Link
              href="/shop/drops"
              className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-[#FFBA94]/65 dark:hover:text-[#FFBA94]"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {spotlightProducts.map((p) => {
              const pid = normalizeShopifyProductId(p.id) || ''
              const row = editionByProductId.get(pid)
              const img = p.featuredImage?.url
              const sold = row?.editionsSold ?? 0
              const total = row?.editionTotal
              const price = row?.priceUsd
              const stageKey = row?.stageKey ?? 'ground_floor'
              return (
                <Link
                  key={p.id}
                  href={`/shop/${encodeURIComponent(p.handle)}`}
                  className="rounded-2xl border border-stone-200/90 bg-white/95 p-3.5 shadow-sm transition-shadow hover:shadow-md dark:border-white/10 dark:bg-[#201c1c]/90"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
                      Live now
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                        ladderStageBadgeClass(stageKey)
                      )}
                    >
                      {ladderStageShortLabel(stageKey)}
                    </span>
                  </div>
                  <div className="relative mb-2 aspect-[4/3] w-full overflow-hidden rounded-lg bg-stone-100 dark:bg-stone-800">
                    {img ? (
                      <Image
                        src={getProxiedImageUrl(img)}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width:768px) 100vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-stone-900 dark:text-[#FFBA94]">{p.vendor || 'Artist'}</p>
                  <p className="text-xs text-stone-500 dark:text-[#FFBA94]/65">{p.title}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-medium">{price != null ? `$${price}` : '—'}</span>
                    {total != null ? (
                      <span className="text-[11px] text-stone-500 dark:text-[#FFBA94]/65">
                        {sold} of {total} sold
                      </span>
                    ) : null}
                  </div>
                </Link>
              )
            })}
            {spotlightProducts.length < 2 &&
              [0, 1].slice(spotlightProducts.length).map((i) => (
                <div
                  key={`ph-${i}`}
                  className="rounded-2xl border border-dashed border-stone-200/80 bg-stone-50/50 p-3.5 dark:border-white/10 dark:bg-[#201c1c]/40"
                >
                  <p className="text-sm text-stone-500 dark:text-[#FFBA94]/60">More drops loading soon.</p>
                </div>
              ))}
            <div className="rounded-2xl border border-stone-200/90 bg-white/95 p-3.5 dark:border-white/10 dark:bg-[#201c1c]/90">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[#A32D2D] dark:text-red-300">
                  Drops Thursday
                </span>
              </div>
              <div className="relative mb-2 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400 dark:bg-stone-800 dark:text-[#FFBA94]/50">
                Upcoming edition
              </div>
              <p className="text-sm font-medium text-stone-900 dark:text-[#FFBA94]">Next on the calendar</p>
              <p className="text-xs text-stone-500 dark:text-[#FFBA94]/65">Ground floor from $40</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-stone-500 dark:text-[#FFBA94]/65">From $40</span>
                <UpcomingDropCountdown targetIso={upcomingIso} notifyHref="/shop/reserve" />
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="md" background="experience" className="!pt-2 !pb-10">
        <Container maxWidth="default" paddingX="gutter">
          <div className="rounded-2xl border border-stone-200/90 bg-white/95 p-5 dark:border-white/10 dark:bg-[#201c1c]/90">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
              How pricing works
            </p>
            <p className="mb-4 text-[15px] font-medium tracking-tight text-stone-900 dark:text-[#FFBA94]">
              Prices only go up. Editions are finite. When they&apos;re gone, they&apos;re gone.
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {HOME_LADDER_DISPLAY.map((step) => (
                <div
                  key={step.key}
                  className={cn(
                    'rounded-lg px-1 py-2.5 text-center sm:px-2 sm:py-3',
                    ladderStageColumnClass(step.key)
                  )}
                >
                  <div className="text-[9px] font-medium uppercase tracking-wide opacity-90 sm:text-[10px]">
                    {ladderStageShortLabel(step.key)}
                  </div>
                  <div className="mt-1 text-sm font-medium sm:text-base">{step.price}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-[#FFBA94]/75">
              Every edition climbs as it sells through. Early collectors pay ground floor. Late collectors may not
              get in at all.
            </p>
          </div>
        </Container>
      </SectionWrapper>

      <SectionWrapper spacing="md" background="default" className="!pt-2 !pb-10">
        <Container maxWidth="default" paddingX="gutter">
          <div className="rounded-2xl bg-stone-900 px-5 py-6 text-white sm:px-8 sm:py-8 dark:bg-stone-950 dark:text-[#FFBA94]">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-lg flex-1">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white/60 dark:text-[#FFBA94]/60">
                  The Reserve · $20/month
                </p>
                <h2 className="text-xl font-medium leading-snug tracking-tight text-white dark:text-[#FFBA94] sm:text-2xl">
                  Never miss an artist you love.
                </h2>
                <p className="mt-3 text-[13px] leading-relaxed text-white/75 dark:text-[#FFBA94]/80">
                  Follow any artist on the roster. When they drop, you get 48-hour early access, ground-floor priority,
                  and monthly credit that rolls into your next purchase.
                </p>
                <Link
                  href="/shop/reserve"
                  prefetch={false}
                  className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-stone-900 dark:bg-[#FFBA94] dark:text-[#171515]"
                >
                  Join the Reserve
                </Link>
              </div>
              <div className="w-full shrink-0 text-[13px] leading-relaxed text-white/85 dark:text-[#FFBA94]/85 md:w-44">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/55 dark:text-[#FFBA94]/55">
                  Members get
                </p>
                <ul className="space-y-1">
                  <li>48h early access</li>
                  <li>Priority allocation</li>
                  <li>$20/mo drop credit</li>
                  <li>Ground-floor price lock</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>

      {featuredArtists.length > 0 && (
        <SectionWrapper spacing="md" background="experience" className="!pt-2 !pb-10">
          <Container maxWidth="default" paddingX="gutter">
            <div className="mb-4 flex items-baseline justify-between gap-4 px-1">
              <h2 className="text-lg font-medium text-stone-900 dark:text-[#FFBA94]">Follow your artists</h2>
              <Link
                href="/shop/artists"
                className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:text-[#FFBA94]/65"
              >
                View roster →
              </Link>
            </div>
            <CollectorHomeArtistRoster artists={featuredArtists} />
          </Container>
        </SectionWrapper>
      )}

      <SectionWrapper spacing="md" background="default" className="!pt-2 !pb-10">
        <Container maxWidth="default" paddingX="gutter">
          <div className="mx-auto max-w-2xl rounded-2xl border border-stone-200/90 bg-white/90 p-5 dark:border-white/10 dark:bg-[#201c1c]/80">
            <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 dark:text-[#FFBA94]/60">
              The display your collection lives on
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[10px] text-stone-400 dark:bg-stone-800 dark:text-[#FFBA94]/50">
                Lamp
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-[#FFBA94]">Street Collector lamp</p>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-[#FFBA94]/75">
                  Backlit, swappable prints — the infrastructure that makes your collection visible at home.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-stone-900 dark:text-[#FFBA94]">From $149</span>
                  <Link
                    href={streetLampProductPath()}
                    className="text-xs font-medium text-[#047AFF] underline-offset-2 hover:underline dark:text-sky-400"
                  >
                    Shop the lamp →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </SectionWrapper>

      {debraQuote ? (
        <SectionWrapper spacing="md" background="experience" className="!pt-2 !pb-12">
          <Container maxWidth="default" paddingX="gutter">
            <blockquote className="font-serif text-lg leading-relaxed text-stone-800 dark:text-[#FFBA94]/90 sm:text-xl">
              “{debraQuote}”
            </blockquote>
            <p className="mt-4 text-sm text-stone-500 dark:text-[#FFBA94]/65">— Debra G., Street Collector collector</p>
          </Container>
        </SectionWrapper>
      ) : null}

      <StreetCollectorFAQ
        title={streetCollectorContent.faq.title}
        groups={streetCollectorContent.faq.groups}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href="/shop/artists"
          prefetch={false}
          className="flex min-h-[48px] w-full max-w-md items-center justify-center rounded-lg bg-stone-900 px-5 py-3 text-sm font-semibold text-white dark:bg-[#FFBA94] dark:text-[#171515]"
        >
          Browse artists
        </Link>
      </div>
    </div>
  )
}
