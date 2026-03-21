import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Container,
  SectionWrapper,
} from '@/components/impact'
import { VideoPlayer } from '@/components/sections'
import { streetCollectorContent } from '@/content/street-collector'
import {
  getCollection,
  getCollectionWithListProducts,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'
import { fetchMeetTheStreetLampStageMediaFromShopify } from '@/lib/shopify/meet-the-street-lamp-media'
import { getArtistImageByHandle } from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ValuePropVideoCard } from './MultiColumnVideoSection'
import type { MeetTheLampStage } from './MeetTheStreetLamp'

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
  const isLargeTrustIcon = item.icon === 'returns' || item.icon === 'shipping'
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

  const lamp = streetCollectorContent.meetTheLamp
  const shopifyLampStages = apiConfigured
    ? await fetchMeetTheStreetLampStageMediaFromShopify()
    : []

  const meetTheStreetLampStages: MeetTheLampStage[] = lamp.stages.map(
    (base, i) => {
      const s = shopifyLampStages[i]
      const desktop =
        (s?.desktopVideo?.trim() && s.desktopVideo) || lamp.desktopVideo
      const mobile =
        (s?.mobileVideo?.trim() && s.mobileVideo) ||
        (s?.desktopVideo?.trim() && s.desktopVideo) ||
        lamp.mobileVideo
      const rawPoster =
        (s?.poster?.trim() && s.poster) || lamp.poster
      return {
        title: s?.title?.trim() ? s.title.trim() : base.title,
        description: s?.description?.trim()
          ? s.description.trim()
          : base.description,
        desktopVideo: desktop,
        mobileVideo: mobile,
        poster: getProxiedImageUrl(rawPoster),
      }
    }
  )

  return (
    <div className="dark w-full bg-[#171515] text-[#FFBA94] pb-16 md:pb-0">
      {/* Desktop top bar - logo, menu, CTA when scrolled past hero */}
      <DesktopTopBar
        text={streetCollectorContent.hero.cta.text}
        href={streetCollectorContent.experienceUrl}
        logoUrl={HOME_LOGO_URL}
      />
      {/* Sticky CTA - always visible on mobile, no scroll logic */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center px-4 py-4 md:hidden"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          href={streetCollectorContent.experienceUrl}
          prefetch={false}
          className="w-full max-w-md flex items-center justify-center min-h-[52px] text-sm font-semibold rounded-lg px-5 py-3.5 shadow-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#FFBA94', color: '#390000' }}
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

      {/* Hero - Video with logo overlay */}
      <div id="street-collector-hero" className="relative">
        <div
          id="street-collector-hero-sentinel"
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          aria-hidden
        />
        {/* Logo overlay on hero — z-[40] above VideoPlayer overlay (z-30) so it stays clickable */}
        <Link
          href="/"
          aria-label="Street Collector Home"
          className={cn(
            'absolute left-1/2 z-[40] inline-flex -translate-x-1/2 items-center justify-center p-2 -m-2 opacity-100 pointer-events-auto transition-transform hover:scale-105 hover:opacity-100',
            'top-[max(1rem,env(safe-area-inset-top,0px))] sm:top-[max(1.5rem,env(safe-area-inset-top,0px))]'
          )}
          style={{ boxSizing: 'content-box' }}
        >
          <Image
            src={getProxiedImageUrl(HOME_LOGO_URL)}
            alt=""
            width={32}
            height={32}
            className="shrink-0 w-8 h-8 object-contain drop-shadow-md opacity-100 pointer-events-none"
            loading="eager"
          />
        </Link>
        <VideoPlayer
          video={{
            url: streetCollectorContent.hero.video,
            poster: getProxiedImageUrl(streetCollectorContent.hero.image),
            autoplay: true,
            loop: true,
            muted: true,
          }}
          overlay={{
            headline: streetCollectorContent.hero.headline,
            subheadline: streetCollectorContent.hero.subheadline,
            ctaUrl: streetCollectorContent.experienceUrl,
            cta: {
              text: streetCollectorContent.hero.cta.text,
              url: streetCollectorContent.experienceUrl,
              style: 'glassmorphism',
              backgroundColor: '#FFBA94',
              color: '#390000',
            },
            position: 'top-center',
            ctaPosition: 'bottom',
            headlineSize: 'medium',
            subheadlineFirst: true,
            textColor: '#FFBA94',
            overlayColor: '#000000',
            overlayOpacity: 10,
          }}
          size="full"
          fullWidth={true}
          showControls={false}
        />
      </div>

      {/* Meet the Street Lamp — one video (desktop/mobile), progress bar rotates through stage texts */}
      <MeetTheStreetLamp
        title={lamp.title}
        stages={meetTheStreetLampStages}
        cue={lamp.cue}
        cueHref={streetCollectorContent.experienceUrl}
      />

      {/* Bringing art into everyday life + In Collaboration With — unified section */}
      {featuredArtists.length > 0 && (
        <ArtistCarousel
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
            <div className="space-y-6 sm:space-y-8">
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
              {/* Banner on mobile only — directly under 3rd video */}
              <div className="md:hidden">
                <div className="w-full rounded-2xl border border-[#ffba94]/15 bg-[#201c1c]/55 p-6 sm:p-8">
                  <div className="grid grid-cols-1 gap-6">
                    {streetCollectorContent.valueProps.map((p, i) => (
                      <div key={i} className="flex flex-col gap-2 text-center">
                        <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#FFBA94] text-[#390000] font-body text-sm font-medium shrink-0 mx-auto">
                          {i + 1}
                        </span>
                        <h3 className="font-body text-base sm:text-lg font-semibold text-[#FFBA94]">
                          {p.title}
                        </h3>
                        <p className="font-body text-sm sm:text-base text-[#FFBA94]/90 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* Value prop banner — desktop only. Image right above the banner card. */}
      <section className="hidden md:block bg-[#171515] pt-2 sm:pt-4 md:pt-5 pb-8 sm:pb-10 md:pb-12 overflow-hidden">
        <Container maxWidth="default" paddingX="gutter">
          <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-0">
            {/* Image right above the banner — proxied to avoid third-party cookies */}
            <img
              src={getProxiedImageUrl('https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png?v=1771844884&width=1200')}
              alt=""
              loading="lazy"
              decoding="async"
              width={1200}
              height={280}
              className="w-full max-w-4xl h-[280px] object-cover object-top pointer-events-none mx-auto block"
              aria-hidden
            />
            {/* Banner card — directly below the image */}
            <div className="w-full rounded-b-2xl rounded-t-none border border-[#ffba94]/10 bg-[#201c1c]/50 p-6 sm:p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {streetCollectorContent.valueProps.map((p, i) => (
                  <div key={i} className="flex flex-col gap-2 text-center md:text-left">
                    <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#FFBA94] text-[#390000] font-body text-sm font-medium shrink-0 md:mx-0 mx-auto">
                      {i + 1}
                    </span>
                    <h3 className="font-body text-base sm:text-lg font-semibold text-[#FFBA94]">
                      {p.title}
                    </h3>
                    <p className="font-body text-sm sm:text-base text-[#FFBA94]/90 leading-relaxed">
                      {p.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials - Join 3000+ Collectors (with media: video/image) */}
      <TestimonialCarousel
        title={streetCollectorContent.testimonials.title}
        subtitle={streetCollectorContent.testimonials.subtitle}
        testimonials={streetCollectorContent.testimonials.quotes}
        fullWidth={true}
      />

      {/* Trust Bar — Free shipping, Guarantee, Returns (We've got you covered) */}
      <SectionWrapper
        spacing="xs"
        background="experience"
        className="pb-0 !py-5 sm:!py-6 md:!py-8 xl:!py-10"
      >
        <Container maxWidth="default" paddingX="gutter">
          <h2 className="mb-4 text-center font-serif text-3xl font-medium tracking-tight text-experience-highlight-soft sm:mb-6 sm:text-4xl md:mb-8 md:text-5xl lg:mb-10 lg:text-6xl">
            We&apos;ve got you covered
          </h2>
          {/* Mobile: stacked rows, no card or dividers */}
          <div className="mx-auto flex max-w-md flex-col items-center gap-10 md:hidden">
            {streetCollectorContent.trustBar.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex flex-col items-center gap-3 text-center',
                  item.icon === 'guarantee' && '-translate-y-2'
                )}
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
