import { Metadata } from 'next'
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
import { MultiColumnVideoSection } from './MultiColumnVideoSection'
import { MeetTheStreetLamp } from './MeetTheStreetLamp'
import { TestimonialCarousel } from './TestimonialCarousel'
import { FixedCTAButton } from './FixedCTAButton'
import { StreetCollectorFAQ } from './StreetCollectorFAQ'
import { ArtistCarousel } from '@/components/sections/ArtistCarousel'

const HOME_LOGO_URL = 'https://thestreetcollector.com/cdn/shop/files/Group_707.png?v=1767356535&width=100'

export const metadata: Metadata = {
  title: 'Street Collector - Revolutionizing The Urban Art World',
  description:
    'Discover your city\'s vibrant art scene, connect with your favourite artists, ignite your creativity, and claim exclusive masterpieces in an exciting new way.',
}

export const dynamic = 'force-dynamic'

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
      // Fetch artist images from configured list
      featuredArtists = await Promise.all(
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
      )

      // Add 2nd edition artists from season-2 collection (vendors not already in list)
      const existingHandles = new Set(
        featuredArtists.map((a) => a.handle.replace(/-\d+$/, '').toLowerCase())
      )
      const season2Col = await getCollectionWithListProducts(SEASON_2_HANDLE, {
        first: 100,
        sortKey: 'MANUAL',
      }).catch(() => null)
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
    <main className="min-h-screen bg-[#F5F5F5] pb-28 sm:pb-24">
      {/* Fixed CTA - stays visible as user scrolls (replaces top nav) */}
      <FixedCTAButton
        text={streetCollectorContent.hero.cta.text}
        href={streetCollectorContent.experienceUrl}
        logoUrl={HOME_LOGO_URL}
      />
      {/* API Warning (dev only) */}
      {apiError && process.env.NODE_ENV === 'development' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <Container maxWidth="default" paddingX="gutter">
            <p className="text-sm text-amber-800">
              {apiError} Set NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN and SHOPIFY_SHOP.
            </p>
          </Container>
        </div>
      )}

      {/* Hero - Video with logo overlay */}
      <div id="street-collector-hero" className="relative">
        {/* Sentinel for scroll-aware CTA (bottom of hero) */}
        <div
          id="street-collector-hero-sentinel"
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          aria-hidden
        />
        {/* Logo overlay on hero */}
        <Link
          href="/shop/street-collector"
          aria-label="Street Collector Home"
          className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 z-20 inline-flex items-center justify-center p-2 -m-2 transition-transform hover:scale-105 safe-area-inset-top"
        >
          <img
            src={HOME_LOGO_URL}
            alt=""
            width={32}
            height={32}
            className="shrink-0 w-8 h-8 object-contain drop-shadow-lg"
          />
        </Link>
        <VideoPlayer
          video={{
            url: `/api/proxy-video?url=${encodeURIComponent(streetCollectorContent.hero.video)}`,
            poster: streetCollectorContent.hero.image,
            autoplay: true,
            loop: true,
            muted: true,
          }}
          overlay={{
            headline: streetCollectorContent.hero.headline,
            subheadline: streetCollectorContent.hero.subheadline,
            ctaUrl: streetCollectorContent.experienceUrl,
            cta: { text: streetCollectorContent.hero.cta.text, url: streetCollectorContent.experienceUrl, style: 'glassmorphism' },
            position: 'lower-center',
            headlineSize: 'large',
            textColor: '#ffffff',
            overlayColor: '#000000',
            overlayOpacity: 40,
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
        poster={streetCollectorContent.meetTheLamp.poster}
        cue={streetCollectorContent.meetTheLamp.cue}
        cueHref={streetCollectorContent.experienceUrl}
      />

      {/* Value Props — multi-column videos (Inspire / Build collection / Support Artists) */}
      <MultiColumnVideoSection
        title={streetCollectorContent.valuePropsSectionTitle}
        items={streetCollectorContent.valueProps.map((p) => ({
          title: p.title,
          description: p.description,
          poster: p.poster,
          video: p.video,
        }))}
        cue={streetCollectorContent.valuePropsCue}
        cueHref={streetCollectorContent.experienceUrl}
      />

      {/* Trust Bar — Free shipping, Guarantee, Returns */}
      <SectionWrapper spacing="xs" background="default">
        <Container maxWidth="default" paddingX="gutter">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 py-6 md:py-8">
            {streetCollectorContent.trustBar.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 mb-5 flex items-center justify-center">
                  {item.icon === 'shipping' && (
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200/80 flex items-center justify-center border border-neutral-200/60">
                      <svg className="w-10 h-10 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Free</span>
                    </div>
                  )}
                  {item.icon === 'guarantee' && (
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200/80 flex items-center justify-center border border-neutral-200/60">
                      <svg className="w-10 h-10 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold tracking-tight text-white">12 mo</span>
                    </div>
                  )}
                  {item.icon === 'returns' && (
                    <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200/80 flex items-center justify-center border border-neutral-200/60">
                      <svg className="w-10 h-10 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                      </svg>
                      <span className="absolute -bottom-1.5 right-1.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold tracking-tight text-white">30d</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">{item.label}</h3>
                <p className="text-sm sm:text-base text-neutral-600 leading-snug">{item.description ?? ''}</p>
              </div>
            ))}
          </div>
          {streetCollectorContent.trustBarCue && (
            <div className="text-center pt-4">
              <a
                href={streetCollectorContent.experienceUrl}
                className="text-base sm:text-lg text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors"
              >
                {streetCollectorContent.trustBarCue}
              </a>
            </div>
          )}
        </Container>
      </SectionWrapper>

      {/* Testimonials - Join 3000+ Collectors (with media: video/image) */}
      <TestimonialCarousel
        title={streetCollectorContent.testimonials.title}
        subtitle={streetCollectorContent.testimonials.subtitle}
        testimonials={streetCollectorContent.testimonials.quotes}
        fullWidth={true}
      />

      {/* In Collaboration With — Featured Artists (after reviews) */}
      {featuredArtists.length > 0 && (
        <ArtistCarousel
          title={streetCollectorContent.featuredArtists.title}
          titleSize="3xl"
          headerAlignment="center"
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
        />
      )}

      {/* Artists momentum cue + scarcity */}
      {(streetCollectorContent.featuredArtistsCue || streetCollectorContent.featuredArtistsScarcity) && (
        <SectionWrapper spacing="sm" background="default">
          <Container maxWidth="default" paddingX="gutter">
            <div className="text-center space-y-2">
              {streetCollectorContent.featuredArtistsCue && (
                <a
                  href={streetCollectorContent.experienceUrl}
                  className="block text-base sm:text-lg text-neutral-600 hover:text-neutral-900 underline underline-offset-2 transition-colors"
                >
                  {streetCollectorContent.featuredArtistsCue}
                </a>
              )}
              {streetCollectorContent.featuredArtistsScarcity && (
                <p className="text-sm text-neutral-500">
                  {streetCollectorContent.featuredArtistsScarcity}
                </p>
              )}
            </div>
          </Container>
        </SectionWrapper>
      )}

      {/* FAQ */}
      <StreetCollectorFAQ
        title={streetCollectorContent.faq.title}
        groups={streetCollectorContent.faq.groups}
      />
    </main>
  )
}
