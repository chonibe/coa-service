import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
} from '@/components/impact'
import { streetCollectorContent } from '@/content/street-collector'
import {
  getCollection,
  getCollectionWithListProducts,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'
import { getArtistImageByHandle } from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ValuePropVideoCard } from './MultiColumnVideoSection'

const DesktopTopBar = dynamic(
  () => import('./DesktopTopBar').then((m) => ({ default: m.DesktopTopBar }))
)

const MeetTheStreetLamp = dynamic(
  () => import('./MeetTheStreetLamp').then((m) => ({ default: m.MeetTheStreetLamp })),
  { loading: () => <section className="min-h-[280px] bg-[#171515]" aria-hidden /> }
)
const TestimonialCarousel = dynamic(
  () => import('./TestimonialCarousel').then((m) => ({ default: m.TestimonialCarousel })),
  { loading: () => <section className="min-h-[200px] bg-[#171515]" aria-hidden /> }
)
const StreetCollectorFAQ = dynamic(
  () => import('./StreetCollectorFAQ').then((m) => ({ default: m.StreetCollectorFAQ })),
  { loading: () => <section className="min-h-[120px] bg-[#171515]" aria-hidden /> }
)
const ArtistCarousel = dynamic(
  () => import('@/components/sections/ArtistCarousel').then((m) => ({ default: m.ArtistCarousel })),
  { loading: () => <section className="min-h-[400px] bg-[#171515]" aria-hidden /> }
)

/** When false, hides “What happens next” steps, reassurance, Start your collection, and The Reserve link. */
const SHOW_STREET_COLLECTOR_FUNNEL_BRIDGE = false

// 64×64 request for 32px display (2x) to minimize file size
const HOME_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/logo_1.png?v=1773229683&width=64&height=64'

export const metadata: Metadata = {
  title: 'Street Collector - Revolutionizing The Urban Art World',
  description:
    'Discover your city\'s vibrant art scene, connect with your favourite artists, ignite your creativity, and claim exclusive masterpieces in an exciting new way.',
}

// Allow revalidation so bfcache can work; page uses Shopify API so short revalidate
export const revalidate = 60

type TrustBarItem = (typeof streetCollectorContent.trustBar)[number]

const TRUST_BAR_ICON_SRC: Record<TrustBarItem['icon'], string> = {
  shipping: '/street-collector/trust/shipping.svg',
  guarantee: '/street-collector/trust/12months.svg',
  returns: '/street-collector/trust/returns.svg',
}

function TrustBarItemIcon({
  item,
  variant,
}: {
  item: TrustBarItem
  variant: 'compact' | 'featured'
}) {
  const wrap =
    variant === 'compact'
      ? 'inline-flex shrink-0 items-center justify-center'
      : 'inline-flex items-center justify-center'
  const isLargeTrustIcon =
    item.icon === 'returns' || item.icon === 'shipping' || item.icon === 'guarantee'
  const iconClass =
    variant === 'featured'
      ? 'h-20 w-20'
      : isLargeTrustIcon
        ? 'h-20 w-20'
        : 'h-14 w-14'
  const dim = variant === 'featured' ? 80 : isLargeTrustIcon ? 80 : 56

  return (
    <span className={wrap} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- local flat SVG assets */}
      <img
        src={TRUST_BAR_ICON_SRC[item.icon]}
        alt=""
        className={cn(iconClass, 'object-contain')}
        width={dim}
        height={dim}
      />
    </span>
  )
}

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

  const SEASON_2_HANDLE = '2025-edition'

  if (apiConfigured) {
    try {
      // Fetch featured artists and season-2 collection in parallel
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

      // Add 2nd edition artists from season-2 collection (vendors not already in list)
      const existingHandles = new Set(
        featuredArtists.map((a) => a.handle.replace(/-\d+$/, '').toLowerCase())
      )
      const season2Products = season2Col?.products?.edges?.map((e) => e.node) ?? []
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
      // Merge: season 2 first, then season 1. Deduplicate by name (prefer richer image+description).
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
      // Start with Jérôme Masi (Annecy)
      const leadHandle = 'jerome-masi'
      const leadIdx = featuredArtists.findIndex(
        (a) => a.handle.replace(/-\d+$/, '').toLowerCase() === leadHandle
      )
      if (leadIdx > 0) {
        const [lead] = featuredArtists.splice(leadIdx, 1)
        featuredArtists.unshift(lead)
      }
    } catch (error: any) {
      console.error('Street Collector page API error:', error.message)
      apiError = error.message
    }
  } else {
    apiError = 'Shopify Storefront API not configured.'
  }

  const trustPromoLine = streetCollectorContent.meetTheLamp.trustMicroItems.join(' · ')

  return (
    <div className="dark w-full bg-[#171515] text-[#FFBA94] pb-16 md:pb-0">
      {/* Thin promo bar — shipping / guarantee / returns (above nav on desktop, top of page on mobile) */}
      <div className="fixed top-0 left-0 right-0 z-[122] hidden md:flex flex-col">
        <div
          className="flex w-full items-center justify-center border-b border-white/[0.08] bg-[#0f0e0e] px-3 py-1 text-center text-[11px] font-medium leading-tight tracking-wide text-[#FFBA94]/75 sm:text-xs sm:py-1.5"
          style={{ paddingTop: 'max(0.375rem, env(safe-area-inset-top, 0px))' }}
          role="region"
          aria-label="Shipping, guarantee, and returns"
        >
          {trustPromoLine}
        </div>
        <DesktopTopBar
          embedded
          text={streetCollectorContent.hero.cta.text}
          href={streetCollectorContent.experienceUrl}
          logoUrl={HOME_LOGO_URL}
        />
      </div>
      <div
        className="fixed top-0 left-0 right-0 z-[122] border-b border-white/[0.08] bg-[#0f0e0e] py-1 md:hidden"
        style={{ paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))' }}
        role="region"
        aria-label="Shipping, guarantee, and returns"
      >
        <p className="px-2 text-center text-[10px] font-medium leading-snug tracking-wide text-[#FFBA94]/75 sm:text-[11px]">
          {trustPromoLine}
        </p>
      </div>
      {/* Reserve space under fixed mobile promo (height ≈ promo + safe area) */}
      <div
        className="md:hidden shrink-0"
        style={{ height: 'calc(2.125rem + env(safe-area-inset-top, 0px))' }}
        aria-hidden
      />
      {/* Sticky CTA - always visible on mobile, no scroll logic */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-4 md:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href={streetCollectorContent.experienceUrl}
          prefetch={false}
          className="flex min-h-[52px] w-full max-w-md items-center justify-center rounded-lg bg-[#047AFF] px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#0366d6] hover:opacity-90"
        >
          {streetCollectorContent.hero.cta.text}
        </Link>
      </div>
      {/* API Warning (dev only) */}
      {apiError && process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-3">
          <Container maxWidth="default" paddingX="gutter">
            <p className="text-sm text-amber-200">
              {apiError} Set NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN and SHOPIFY_SHOP.
            </p>
          </Container>
        </div>
      )}

      {/* Mobile: in-flow logo (safe area handled by promo bar + spacer above) */}
      <div className="flex justify-center px-5 pt-3 pb-2 md:hidden">
        <Link
          href="/"
          aria-label="Street Collector Home"
          className="inline-flex items-center justify-center p-2 -m-2 transition-transform hover:scale-105"
        >
          <Image
            src={getProxiedImageUrl(HOME_LOGO_URL)}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain drop-shadow-md"
            loading="eager"
            priority
          />
        </Link>
      </div>

      {/* Meet the Street Lamp — desktop + mobile */}
      <MeetTheStreetLamp
        title={streetCollectorContent.meetTheLamp.title}
        taglineLines={streetCollectorContent.meetTheLamp.taglineLines}
        stages={streetCollectorContent.meetTheLamp.stages}
        desktopVideo={streetCollectorContent.meetTheLamp.desktopVideo}
        mobileVideo={streetCollectorContent.meetTheLamp.mobileVideo}
        poster={getProxiedImageUrl(streetCollectorContent.meetTheLamp.poster)}
        pricingChips={
          Array.isArray(streetCollectorContent.meetTheLamp.pricingChips)
            ? streetCollectorContent.meetTheLamp.pricingChips
            : undefined
        }
        cue={streetCollectorContent.meetTheLamp.cue}
        cueHref={streetCollectorContent.experienceUrl}
        className="pt-3 pb-8 sm:pt-4 sm:pb-10 md:pt-5 md:pb-8 lg:pt-6 lg:pb-10"
      />

      {SHOW_STREET_COLLECTOR_FUNNEL_BRIDGE && (
        <SectionWrapper spacing="xs" background="experience" className="!py-8 sm:!py-10">
          <Container maxWidth="default" paddingX="gutter">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-2xl font-medium tracking-tight text-[#FFBA94] sm:text-3xl md:text-4xl">
                {streetCollectorContent.funnelBridge.title}
              </h2>
              <p className="mt-2 text-sm text-[#FFBA94]/80 sm:text-base">
                {streetCollectorContent.funnelBridge.subtitle}
              </p>
              <ol className="mt-6 space-y-3 text-left text-sm text-[#FFBA94]/90 sm:text-base">
                {streetCollectorContent.funnelBridge.steps.map((step, i) => (
                  <li key={step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#047AFF]/20 text-xs font-bold text-[#047AFF]">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-[#FFBA94]/60 sm:text-sm">{streetCollectorContent.funnelBridge.reassurance}</p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href={streetCollectorContent.funnelBridge.cta.url}
                  prefetch={false}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#047AFF] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#0366d6]"
                >
                  {streetCollectorContent.funnelBridge.cta.text}
                </Link>
                <Link
                  href="/shop/reserve"
                  prefetch={false}
                  className="text-sm font-medium text-[#FFBA94]/90 underline underline-offset-2 hover:text-[#FFBA94]"
                >
                  The Reserve — lock a price
                </Link>
              </div>
            </div>
          </Container>
        </SectionWrapper>
      )}

      {/* Bringing art into everyday life + In Collaboration With — unified section */}
      {featuredArtists.length > 0 && (
        <ArtistCarousel
          className="!pt-8 !pb-10 sm:!pt-9 sm:!pb-12 md:!pt-10 md:!pb-14 lg:!pt-12 xl:!pb-16"
          disableArtistClicksOnMobile
          title={streetCollectorContent.featuredArtists.title}
          titleSize="2xl"
          titleTag="h2"
          namePosition="below"
          headerAlignment="center"
          titleClassName="font-serif font-medium text-[#FFBA94]"
          sectionBackground="experience"
          arrowButtonClassName="bg-[#FFBA94] text-[#390000]"
          subtitle={streetCollectorContent.featuredArtists.subtitle}
          artists={featuredArtists}
          autoScroll={true}
          showArrows={true}
          showLink={false}
          showInfoSheet={true}
          showProgressBar={false}
          cardWidth={280}
          cardGap={24}
          fullWidth={true}
          mobileAvatarStyle
          footerCue={streetCollectorContent.featuredArtistsCue}
          footerScarcity={streetCollectorContent.featuredArtistsScarcity}
          footerCueHref={streetCollectorContent.experienceUrl}
          valueProps={[]}
          trailingContent={
            streetCollectorContent.featuredArtists.afterCarousel ? (
              <p className="text-center font-body text-lg text-[#FFBA94]/90 sm:text-xl md:text-2xl">
                {streetCollectorContent.featuredArtists.afterCarousel}
              </p>
            ) : null
          }
          leadingContent={
            <div className="space-y-10 sm:space-y-6">
              <h2 className="font-body font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] tracking-tight text-center">
                {streetCollectorContent.valuePropsSectionTitle}
              </h2>
              <ValuePropVideoCard
                items={streetCollectorContent.valueProps.map((p) => ({
                  title: p.title,
                  description: p.description,
                  poster: getProxiedImageUrl(p.poster),
                  video: p.video,
                }))}
              />
            </div>
          }
        />
      )}

      {/* Testimonials - Join 3000+ Collectors (with media: video/image) */}
      <TestimonialCarousel
        className="!pt-8 !pb-10 sm:!pt-10 sm:!pb-12 md:!pt-12 md:!pb-14"
        title={streetCollectorContent.testimonials.title}
        subtitle={streetCollectorContent.testimonials.subtitle}
        testimonials={streetCollectorContent.testimonials.quotes}
        backdropImageSrc={streetCollectorContent.testimonials.sectionBackdropImage}
        fullWidth={true}
      />

      {/* Trust Bar — Free shipping, Guarantee, Returns */}
      <SectionWrapper
        spacing="xs"
        background="experience"
        className="!py-8 sm:!py-10 md:!py-12"
      >
        <Container maxWidth="default" paddingX="gutter">
          {streetCollectorContent.trustBarTitle ? (
            <h2 className="mb-10 text-center font-serif text-3xl font-medium tracking-tight text-[#FFBA94] sm:mb-12 sm:text-4xl md:mb-14 md:text-5xl">
              {streetCollectorContent.trustBarTitle}
            </h2>
          ) : null}
          {/* Mobile: stacked rows, no card or dividers */}
          <div className="mx-auto flex max-w-md flex-col items-center gap-10 md:hidden">
            {streetCollectorContent.trustBar.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-3 text-center"
              >
                <TrustBarItemIcon item={item} variant="compact" />
                <p className="max-w-[22rem] px-1 text-sm font-bold leading-snug text-experience-highlight-muted">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
          {/* md+: equal-height cards (testimonials-style surface) */}
          <div className="hidden py-2 md:grid md:grid-cols-3 md:items-stretch md:gap-6 lg:gap-8 md:py-8">
            {streetCollectorContent.trustBar.map((item) => (
              <div
                key={item.label}
                className="flex h-full w-full flex-col rounded-2xl border border-[#ffba94]/10 bg-[#201c1c]/55 p-6 text-center shadow-[0_0_0_1px_rgba(255,186,148,0.05)_inset] lg:p-8"
              >
                <div className="flex h-28 shrink-0 items-center justify-center lg:h-32">
                  <TrustBarItemIcon item={item} variant="featured" />
                </div>
                <p className="text-base font-bold leading-snug text-experience-highlight-muted lg:text-lg">
                  {item.label}
                </p>
                <p className="mt-2 min-h-0 flex-1 text-base font-normal leading-relaxed text-experience-highlight-soft/90">
                  {item.description ?? ''}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </SectionWrapper>

      {/* FAQ */}
      <StreetCollectorFAQ
        title={streetCollectorContent.faq.title}
        groups={streetCollectorContent.faq.groups}
      />
    </div>
  )
}
