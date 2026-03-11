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
import { getArtistImageByHandle } from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import Image from 'next/image'
import { ValuePropVideoCard } from './MultiColumnVideoSection'

const DesktopTopBar = dynamic(
  () => import('./DesktopTopBar').then((m) => ({ default: m.DesktopTopBar }))
)

const MeetTheStreetLamp = dynamic(
  () => import('./MeetTheStreetLamp').then((m) => ({ default: m.MeetTheStreetLamp })),
  { loading: () => <section className="min-h-[280px] bg-[#1a0a0a]" aria-hidden /> }
)
const TestimonialCarousel = dynamic(
  () => import('./TestimonialCarousel').then((m) => ({ default: m.TestimonialCarousel })),
  { loading: () => <section className="min-h-[200px] bg-[#1a0a0a]" aria-hidden /> }
)
const StreetCollectorFAQ = dynamic(
  () => import('./StreetCollectorFAQ').then((m) => ({ default: m.StreetCollectorFAQ })),
  { loading: () => <section className="min-h-[120px] bg-[#1a0a0a]" aria-hidden /> }
)
const ArtistCarousel = dynamic(
  () => import('@/components/sections/ArtistCarousel').then((m) => ({ default: m.ArtistCarousel })),
  { loading: () => <section className="min-h-[400px] bg-[#1a0a0a]" aria-hidden /> }
)

// 64×64 request for 32px display (2x) to minimize file size
const HOME_LOGO_URL =
  'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535&width=64&height=64'

export const metadata: Metadata = {
  title: 'Street Collector - Revolutionizing The Urban Art World',
  description:
    'Discover your city\'s vibrant art scene, connect with your favourite artists, ignite your creativity, and claim exclusive masterpieces in an exciting new way.',
}

// Allow revalidation so bfcache can work; page uses Shopify API so short revalidate
export const revalidate = 60

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

  return (
    <main className="dark bg-[#390000] text-[#FFBA94] pb-16 md:pb-0 h-[5950px]">
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
          className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[40] inline-flex items-center justify-center p-2 -m-2 transition-transform hover:scale-105 hover:opacity-100 safe-area-inset-top opacity-100 pointer-events-auto"
          style={{ boxSizing: 'content-box' }}
        >
          <Image
            src={HOME_LOGO_URL}
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
        title={streetCollectorContent.meetTheLamp.title}
        stages={streetCollectorContent.meetTheLamp.stages}
        desktopVideo={streetCollectorContent.meetTheLamp.desktopVideo}
        mobileVideo={streetCollectorContent.meetTheLamp.mobileVideo}
        poster={getProxiedImageUrl(streetCollectorContent.meetTheLamp.poster)}
        cue={streetCollectorContent.meetTheLamp.cue}
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
          sectionBackground="header"
          arrowButtonClassName="bg-[#FFBA94] text-[#390000]"
          className="bg-[#1a0a0a]"
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
                <div className="w-full rounded-2xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 p-6 sm:p-8">
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
                <p className="font-body text-lg sm:text-xl text-[#FFBA94] text-center mt-6">
                  Buy the lamp once, change the artwork anytime.
                </p>
              </div>
            </div>
          }
        />
      )}

      {/* Value prop banner — desktop only. Image right above the banner card. */}
      <section className="hidden md:block bg-[#1a0a0a] pt-2 sm:pt-4 md:pt-5 pb-8 sm:pb-10 md:pb-12 overflow-hidden">
        <Container maxWidth="default" paddingX="gutter">
          <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-0">
            {/* Image right above the banner */}
            <img
              src="https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_8252.png?v=1771844884&width=1200"
              alt=""
              loading="lazy"
              decoding="async"
              width={1200}
              height={280}
              className="w-full max-w-4xl h-[280px] object-cover object-top pointer-events-none mx-auto block"
              aria-hidden
            />
            {/* Banner card — directly below the image */}
            <div className="w-full rounded-b-2xl rounded-t-none bg-[#1a0a0a] p-6 sm:p-8 md:p-10">
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
            <p className="font-body text-lg sm:text-xl md:text-2xl text-[#FFBA94] text-center mt-6 md:mt-8">
              Buy the lamp once, change the artwork anytime.
            </p>
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
      <SectionWrapper spacing="xs" background="header" className="bg-[#2a0000] pb-0">
        <Container maxWidth="default" paddingX="gutter">
          <h2 className="font-serif font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFBA94] tracking-tight text-center mb-6 sm:mb-8 md:mb-10">
            We&apos;ve got you covered
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-6 md:py-8">
            {streetCollectorContent.trustBar.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-[#FFBA94]/10 p-6 sm:p-8 text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 mb-5 flex items-center justify-center">
                  {item.icon === 'shipping' && (
                    <div className="relative w-full h-full rounded-2xl bg-[#FFBA94]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#FFBA94]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-[#FFBA94] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#390000]">Free</span>
                    </div>
                  )}
                  {item.icon === 'guarantee' && (
                    <div className="relative w-full h-full rounded-2xl bg-[#FFBA94]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#FFBA94]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-[#FFBA94] px-2 py-0.5 text-[10px] font-bold tracking-tight text-[#390000]">12 mo</span>
                    </div>
                  )}
                  {item.icon === 'returns' && (
                    <div className="relative w-full h-full rounded-2xl bg-[#FFBA94]/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#FFBA94]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-[#FFBA94] px-2 py-0.5 text-[10px] font-bold tracking-tight text-[#390000]">30d</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#FFBA94] mb-2">{item.label}</h3>
                <p className="text-sm sm:text-base text-[#FFBA94]/90 leading-snug">{item.description ?? ''}</p>
              </div>
            ))}
          </div>
          {streetCollectorContent.trustBarCue && (
            <div className="text-center pt-4">
              <a
                href={streetCollectorContent.experienceUrl}
                className="text-base sm:text-lg text-[#FFBA94]/80 hover:text-[#FFBA94] underline underline-offset-2 transition-colors"
              >
                {streetCollectorContent.trustBarCue}
              </a>
            </div>
          )}
        </Container>
      </SectionWrapper>

      {/* FAQ */}
      <StreetCollectorFAQ
        title={streetCollectorContent.faq.title}
        groups={streetCollectorContent.faq.groups}
      />
    </main>
  )
}
