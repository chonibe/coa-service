import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  Container,
  SectionWrapper,
  SectionHeader,
  Button,
} from '@/components/impact'
import {
  FAQSection,
  ScrollingText,
  Slideshow,
  MediaGrid,
} from '@/components/sections'
import { Spline3DViewer, URLParamModal, URLParamBanner } from '@/components/blocks'
import { homepageContent } from '@/content/homepage'
import { getCollection, getProduct, formatPrice, isOnSale, getDiscountPercentage, isStorefrontConfigured, getStorefrontConfigStatus } from '@/lib/shopify/storefront-client'
import { getHeroSettingsWithFallback, getSecondaryVideoSettingsWithFallback } from '@/lib/shopify/homepage-settings'
import { HomeProductCard } from '../home/HomeProductCard'
import Link from 'next/link'

// Enhanced GSAP Components
import { VideoPlayerEnhanced } from '@/components/sections/VideoPlayerEnhanced'
import { GalleryReveal } from '@/components/shop/GalleryReveal'
import { SimpleProductCarousel } from '@/components/shop/SimpleProductCarousel'
import { ArtistCarousel } from '@/components/sections/ArtistCarousel'
import { KineticPressQuotes } from '@/components/sections/KineticPressQuotes'
import { TransparentHeaderWrapper } from './TransparentHeaderWrapper'

export const metadata: Metadata = {
  title: 'Street Collector - Enhanced Experience',
  description: 'Experience our immersive shop with GSAP-powered animations and interactions.',
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

export default async function ShopHomeV2Page() {
  // Check if Storefront API is configured
  const apiConfigured = isStorefrontConfigured()
  let apiError: string | null = null
  
  // Initialize empty arrays for products
  let newReleases: any[] = []
  let bestSellers: any[] = []
  let featuredProduct: any = null
  
  // Fetch hero settings from Shopify metaobject (with fallback to static content)
  const heroSettings = await getHeroSettingsWithFallback({
    video: {
      url: homepageContent.hero.video.url,
      autoplay: homepageContent.hero.video.autoplay,
      loop: true,
      muted: true,
    },
    headline: homepageContent.hero.content.headline,
    subheadline: homepageContent.hero.content.subheadline,
    ctaText: homepageContent.hero.cta.text,
    ctaUrl: homepageContent.hero.cta.url,
    textColor: homepageContent.hero.settings.textColor,
    overlayColor: homepageContent.hero.settings.overlayColor,
    overlayOpacity: homepageContent.hero.settings.overlayOpacity,
  })
  
  // Fetch secondary video settings from Shopify metaobject (with fallback)
  const secondaryVideoSettings = await getSecondaryVideoSettingsWithFallback({
    url: homepageContent.secondaryVideo.video.url,
    autoplay: homepageContent.secondaryVideo.video.autoplay,
    loop: true,
    muted: true,
    poster: homepageContent.secondaryVideo.video.poster,
  })
  
  // Only fetch from Shopify if API is configured
  if (apiConfigured) {
    try {
      // Fetch featured collections
      const [newReleasesCollection, bestSellersCollection, product] = await Promise.all([
        getCollection(homepageContent.newReleases.collectionHandle, {
          first: homepageContent.newReleases.productsCount,
          sortKey: 'MANUAL', // Respect Shopify collection order
        }).catch(() => null),
        getCollection(homepageContent.bestSellers.collectionHandle, {
          first: 12, // Get more for crate carousel
          sortKey: 'MANUAL', // Respect Shopify collection order
        }).catch(() => null),
        getProduct(homepageContent.featuredProduct.productHandle).catch(() => null),
      ])

      newReleases = newReleasesCollection?.products.edges.map(e => e.node) || []
      bestSellers = bestSellersCollection?.products.edges.map(e => e.node) || []
      featuredProduct = product
    } catch (error: any) {
      console.error('Shop homepage API error:', error.message)
      apiError = error.message
    }
  } else {
    const configStatus = getStorefrontConfigStatus()
    console.warn('Shopify Storefront API not configured:', configStatus)
    apiError = 'Shopify Storefront API not configured. Please set the required environment variables.'
  }
  
  // Fetch artist images from Shopify collections
  const artistsWithImages = await Promise.all(
    homepageContent.featuredArtists.collections.map(async (artist) => {
      try {
        const collection = await getCollection(artist.handle, { first: 1, sortKey: 'MANUAL' }).catch(() => null)
        return {
          handle: artist.handle,
          name: artist.handle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          location: artist.location,
          imageUrl: collection?.image?.url || collection?.products.edges[0]?.node.featuredImage?.url,
        }
      } catch {
        return {
          handle: artist.handle,
          name: artist.handle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          location: artist.location,
        }
      }
    })
  )
  
  const featuredArtists = artistsWithImages

  // Note: Header and Footer are provided by app/shop/layout.tsx
  return (
    <>
      <TransparentHeaderWrapper />
      <main data-page="home-v2">

        {/* API Configuration Warning Banner (dev only) */}
        {apiError && process.env.NODE_ENV === 'development' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
            <Container maxWidth="default" paddingX="gutter">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Shopify Storefront API Not Configured</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Product data is unavailable. Please set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN</code> and <code className="bg-amber-100 px-1 rounded">SHOPIFY_SHOP</code> environment variables.
                  </p>
                </div>
              </div>
            </Container>
          </div>
        )}

        {/* Hero Video Section - ENHANCED - Now fetches from Shopify metaobject */}
        <VideoPlayerEnhanced
          video={{
            url: heroSettings.video.url,
            autoplay: heroSettings.video.autoplay,
            loop: heroSettings.video.loop,
            muted: heroSettings.video.muted,
            poster: heroSettings.video.poster,
          }}
          overlay={{
            headline: heroSettings.headline,
            subheadline: heroSettings.subheadline,
            cta: heroSettings.ctaText && heroSettings.ctaUrl ? {
              text: heroSettings.ctaText,
              url: heroSettings.ctaUrl,
              style: homepageContent.hero.cta.style as 'outline',
            } : undefined,
            textColor: heroSettings.textColor,
            overlayColor: heroSettings.overlayColor,
            overlayOpacity: heroSettings.overlayOpacity,
          }}
          size="full"
          fullWidth={true}
          showControls={true}
          enableScrollEffects={true}
          enableTextAnimation={true}
        />

        {/* New Releases Section - Horizontal Carousel */}
        {newReleases.length > 0 && (
          <SimpleProductCarousel
            title={homepageContent.newReleases.title}
            description=""
            products={newReleases}
            linkText={homepageContent.newReleases.linkText}
            linkHref={`/shop?collection=${homepageContent.newReleases.collectionHandle}`}
          />
        )}

        {/* Spline 3D Viewer Section */}
        <Spline3DViewer
          splineUrl={homepageContent.spline3D.splineUrl}
          iframeTitle={homepageContent.spline3D.iframeTitle}
          position={homepageContent.spline3D.position as 'below'}
          aspectRatio={homepageContent.spline3D.aspectRatio}
          mobileAspectRatio={homepageContent.spline3D.mobileAspectRatio}
          desktopWidthPercent={homepageContent.spline3D.desktopWidthPercent}
          backgroundColor={homepageContent.spline3D.backgroundColor}
          borderRadius={homepageContent.spline3D.borderRadius}
          fullWidth={homepageContent.spline3D.fullWidth}
          removeVerticalSpacing={homepageContent.spline3D.removeVerticalSpacing}
          removeHorizontalSpacing={homepageContent.spline3D.removeHorizontalSpacing}
        />

        {/* Press Quotes Section 1 - ENHANCED with Kinetic Typography */}
        <KineticPressQuotes
          quotes={homepageContent.pressQuotes1.quotes.map((q, i) => ({
            id: `press1-${i}`,
            author: q.author,
            content: q.content,
            rating: q.rating,
            showRating: true,
          }))}
          contentSize="medium"
          fullWidth={homepageContent.pressQuotes1.fullWidth}
          showArrows={true}
          showDots={true}
          autoAdvance={true}
          interval={6000}
        />

        {/* Best Sellers Section - Horizontal Carousel */}
        {bestSellers.length > 0 && (
          <SimpleProductCarousel
            title="Best Sellers"
            description="Browse our most popular artworks"
            products={bestSellers}
            linkText="View all"
            linkHref="/shop?collection=best-sellers"
          />
        )}

        {/* Featured Artists Section - Horizontal Carousel with Arrow Controls */}
        {featuredArtists.length > 0 && (
          <ArtistCarousel
            title={homepageContent.featuredArtists.title}
            artists={featuredArtists}
            showProgressBar={true}
            linkText="View all artists"
            linkHref="/shop/artists"
            cardWidth={320}
            cardGap={32}
            fullWidth={true}
          />
        )}

        {/* Scrolling Text */}
        <ScrollingText
          text={homepageContent.scrollingText.text}
          textSize={homepageContent.scrollingText.textSize as 'small'}
          textStyle={homepageContent.scrollingText.textStyle as 'fill'}
          scrollingMode={homepageContent.scrollingText.scrollingMode as 'auto'}
          scrollingSpeed={homepageContent.scrollingText.scrollingSpeed}
          fullWidth={homepageContent.scrollingText.fullWidth}
        />

        {/* Press Quotes Section 2 - ENHANCED with Kinetic Typography */}
        <KineticPressQuotes
          quotes={homepageContent.pressQuotes2.quotes.map((q, i) => ({
            id: `press2-${i}`,
            author: q.author,
            content: q.content,
            rating: q.rating,
            showRating: true,
          }))}
          contentSize="medium"
          fullWidth={homepageContent.pressQuotes2.fullWidth}
          showArrows={true}
          showDots={true}
          autoAdvance={true}
          interval={6000}
        />

        {/* FAQ Section */}
        <FAQSection
          items={homepageContent.faq.items.map((item, i) => ({
            id: `faq-${i}`,
            question: item.question,
            answer: item.answer,
          }))}
          title={homepageContent.faq.title}
          textPosition="start"
          fullWidth={homepageContent.faq.fullWidth}
        />

        {/* URL Parameter Banner (Simply Gift) */}
        <Suspense fallback={null}>
          <URLParamBanner
            urlParameter={homepageContent.simplyGiftBanner.urlParameter}
            message={homepageContent.simplyGiftBanner.message}
            showCta={homepageContent.simplyGiftBanner.showCta}
            ctaText={homepageContent.simplyGiftBanner.ctaText}
            ctaLink={homepageContent.simplyGiftBanner.ctaLink}
            dismissible={homepageContent.simplyGiftBanner.dismissible}
            alignment={homepageContent.simplyGiftBanner.alignment as any}
            paddingVertical={homepageContent.simplyGiftBanner.paddingVertical}
            paddingHorizontal={homepageContent.simplyGiftBanner.paddingHorizontal}
            fontSize={homepageContent.simplyGiftBanner.fontSize}
            backgroundColor={homepageContent.simplyGiftBanner.backgroundColor}
            textColor={homepageContent.simplyGiftBanner.textColor}
            ctaBackgroundColor={homepageContent.simplyGiftBanner.ctaBackgroundColor}
            ctaTextColor={homepageContent.simplyGiftBanner.ctaTextColor}
            ctaHoverBackgroundColor={homepageContent.simplyGiftBanner.ctaHoverBackgroundColor}
            ctaHoverTextColor={homepageContent.simplyGiftBanner.ctaHoverTextColor}
          />
        </Suspense>

        {/* URL Parameter Modal (Simply Gift) */}
        <Suspense fallback={null}>
          <URLParamModal
            urlParamName={homepageContent.simplyGiftModal.urlParamName}
            urlParamValue={homepageContent.simplyGiftModal.urlParamValue}
            autoDismissEnabled={homepageContent.simplyGiftModal.autoDismiss}
            rememberDismiss={homepageContent.simplyGiftModal.rememberDismiss}
            mediaType={homepageContent.simplyGiftModal.mediaType as 'video'}
            videoUrl={homepageContent.simplyGiftModal.videoUrl}
            videoAutoplay={homepageContent.simplyGiftModal.videoAutoplay}
            videoAspectRatio={homepageContent.simplyGiftModal.videoAspectRatio}
            heading={homepageContent.simplyGiftModal.heading}
            message={homepageContent.simplyGiftModal.message}
            showCta={homepageContent.simplyGiftModal.showCta}
            ctaText={homepageContent.simplyGiftModal.ctaText}
            ctaLink={homepageContent.simplyGiftModal.ctaLink}
            modalMaxWidth={homepageContent.simplyGiftModal.modalMaxWidth}
            modalBackground={homepageContent.simplyGiftModal.modalBackground}
            modalBorderRadius={homepageContent.simplyGiftModal.modalBorderRadius}
            contentPadding={homepageContent.simplyGiftModal.contentPadding}
            backdropColor={homepageContent.simplyGiftModal.backdropColor}
            backdropOpacity={homepageContent.simplyGiftModal.backdropOpacity}
            backdropBlur={homepageContent.simplyGiftModal.backdropBlur}
            headingSize={homepageContent.simplyGiftModal.headingSize}
            headingColor={homepageContent.simplyGiftModal.headingColor}
            messageSize={homepageContent.simplyGiftModal.messageSize}
            textColor={homepageContent.simplyGiftModal.textColor}
            ctaBackground={homepageContent.simplyGiftModal.ctaBackground}
            ctaTextColor={homepageContent.simplyGiftModal.ctaTextColor}
            ctaHoverBackground={homepageContent.simplyGiftModal.ctaHoverBackground}
            ctaBorderRadius={homepageContent.simplyGiftModal.ctaBorderRadius}
          />
        </Suspense>
      </main>
    </>
  )
}
