import { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { StreetCollectorBrandJsonLd } from '@/components/seo/StreetCollectorBrandJsonLd'
import dynamic from 'next/dynamic'
import { Container } from '@/components/impact'
import { streetCollectorContent } from '@/content/street-collector'
import {
  getCollection,
  getCollectionWithListProducts,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'
import { getArtistImageByHandle } from '@/lib/shopify/artist-image'
import { getVendorBioByHandle } from '@/lib/shopify/vendor-bio'
import { EditorialHero } from './EditorialHero'
import { EditorialTrustStrip } from './EditorialTrustStrip'
import { HowItWorksStrip } from './HowItWorksStrip'
import { ProductSpecBlock } from './ProductSpecBlock'
import { RitualDarkBand } from './RitualDarkBand'
import { LimitedEditionBlock } from './LimitedEditionBlock'
import { EditorialFinalCta } from './EditorialFinalCta'
import { StreetCollectorLandingShell } from './StreetCollectorLandingShell'

const TestimonialCarousel = dynamic(
  () => import('./TestimonialCarousel').then((m) => ({ default: m.TestimonialCarousel })),
  { loading: () => <section className="min-h-[200px] bg-white dark:bg-neutral-950" aria-hidden /> }
)
const StreetCollectorFAQ = dynamic(
  () => import('./StreetCollectorFAQ').then((m) => ({ default: m.StreetCollectorFAQ })),
  { loading: () => <section className="min-h-[120px] bg-white dark:bg-neutral-950" aria-hidden /> }
)
const ArtistCarousel = dynamic(
  () => import('@/components/sections/ArtistCarousel').then((m) => ({ default: m.ArtistCarousel })),
  { loading: () => <section className="min-h-[400px] bg-white dark:bg-neutral-950" aria-hidden /> }
)

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'What is Street Collector? | Backlit lamp & limited edition street art prints',
  description:
    'Street Collector pairs a premium illuminated display with swappable limited-edition street art prints from independent artists. Editioned works, Certificate of Authenticity, worldwide shipping.',
  alternates: { canonical: '/shop/street-collector' },
  openGraph: {
    title: 'Street Collector — illuminated art & limited edition prints',
    description:
      'Collect limited edition street art prints and display them in a backlit Street Collector lamp. Small runs, COA, ships worldwide.',
    url: '/shop/street-collector',
    siteName: 'Street Collector',
    type: 'website',
  },
}

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
    href?: string
  }> = []

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
    } catch (error: any) {
      console.error('Street Collector page API error:', error.message)
      apiError = error.message
    }
  } else {
    apiError = 'Shopify Storefront API not configured.'
  }

  const trustPromoLine = streetCollectorContent.meetTheLamp.trustMicroItems.join(' · ')
  const primaryCta = streetCollectorContent.editorialHero.ctaPrimary

  return (
    <StreetCollectorLandingShell
      trustPromoLine={trustPromoLine}
      ctaText={primaryCta.label}
      ctaHref={primaryCta.href}
    >
      <StreetCollectorBrandJsonLd />
      {apiError && process.env.NODE_ENV === 'development' && (
        <div className="border-b border-amber-700/50 bg-amber-900/30 px-4 py-3">
          <Container maxWidth="default" paddingX="gutter">
            <p className="text-sm text-amber-200">
              {apiError} Set NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN and SHOPIFY_SHOP.
            </p>
          </Container>
        </div>
      )}
      <EditorialHero content={streetCollectorContent.editorialHero} />
      <EditorialTrustStrip items={streetCollectorContent.heroTrustStrip} />
      <HowItWorksStrip content={streetCollectorContent.howItWorksEditorial} />
      <ProductSpecBlock content={streetCollectorContent.productSpecEditorial} />
      <RitualDarkBand content={streetCollectorContent.ritualBand} />

      {featuredArtists.length > 0 && (
        <ArtistCarousel
          className="!bg-white !pt-12 !pb-12 dark:!bg-neutral-950 sm:!pt-14 sm:!pb-14 md:!pt-16 md:!pb-16"
          disableArtistClicksOnMobile
          title={streetCollectorContent.featuredArtists.title}
          titleSize="2xl"
          titleTag="h2"
          namePosition="below"
          headerAlignment="center"
          titleClassName="font-serif font-medium text-neutral-900 dark:text-neutral-100"
          sectionBackground="default"
          arrowButtonClassName="border border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100 dark:border-white dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-900"
          subtitle={streetCollectorContent.featuredArtists.subtitle}
          artists={featuredArtists}
          autoScroll={true}
          showArrows={true}
          showLink={true}
          linkText="MORE ARTISTS →"
          linkHref="/shop/explore-artists"
          showInfoSheet={true}
          showProgressBar={false}
          cardWidth={220}
          cardGap={20}
          fullWidth={true}
          mobileAvatarStyle
          footerCue={streetCollectorContent.featuredArtistsCue}
          footerScarcity={streetCollectorContent.featuredArtistsScarcity}
          footerCueHref={streetCollectorContent.experienceUrl}
          valueProps={[]}
          trailingContent={
            streetCollectorContent.featuredArtists.afterCarousel ? (
              <p className="text-center font-body text-lg text-neutral-700 dark:text-neutral-300 sm:text-xl md:text-2xl">
                {streetCollectorContent.featuredArtists.afterCarousel}
              </p>
            ) : null
          }
        />
      )}

      <TestimonialCarousel
        className="!pt-10 !pb-10 sm:!pt-12 sm:!pb-12 md:!pt-14 md:!pb-14"
        title={streetCollectorContent.testimonials.title}
        subtitle={streetCollectorContent.testimonials.subtitle}
        testimonials={[...streetCollectorContent.testimonials.quotes]}
        backdropImageSrc={undefined}
        fullWidth={true}
        variant="editorial"
      />

      <LimitedEditionBlock content={streetCollectorContent.limitedDrop} />

      <EditorialFinalCta
        className="bg-neutral-50 dark:bg-neutral-950"
        content={{
          headline: streetCollectorContent.finalCta.headline,
          subheadline: streetCollectorContent.finalCta.subheadline,
          cta: streetCollectorContent.finalCta.cta,
          ctaSecondary: streetCollectorContent.finalCta.ctaSecondary,
        }}
      />

      <StreetCollectorFAQ title={streetCollectorContent.faq.title} groups={streetCollectorContent.faq.groups} />
    </StreetCollectorLandingShell>
  )
}
