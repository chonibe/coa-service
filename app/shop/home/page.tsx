import { Metadata } from 'next'
import { Suspense } from 'react'
import {
  Container,
  SectionWrapper,
  SectionHeader,
  Button,
  ProductCard,
} from '@/components/impact'
import {
  VideoPlayer,
  PressCarousel,
  ScrollingText,
  FAQSection,
  FeaturedArtistsSection,
  FeaturedProductSection,
  Slideshow,
  MediaGrid,
} from '@/components/sections'
import { Spline3DViewer, URLParamModal, URLParamBanner } from '@/components/blocks'
import { homepageContent } from '@/content/homepage'
import { getCollection, getProduct, formatPrice, isOnSale, getDiscountPercentage, isStorefrontConfigured, getStorefrontConfigStatus } from '@/lib/shopify/storefront-client'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Street Collector - One Lamp, Endless Inspiration',
  description: 'Discover limited edition artworks for the Street Lamp. Collect, swap, and inspire with illuminated art from artists worldwide.',
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

export default async function ShopHomePage() {
  // Check if Storefront API is configured
  const apiConfigured = isStorefrontConfigured()
  let apiError: string | null = null
  
  // Initialize empty arrays for products
  let newReleases: any[] = []
  let bestSellers: any[] = []
  let featuredProduct: any = null
  
  // Only fetch from Shopify if API is configured
  if (apiConfigured) {
    try {
      // Fetch featured collections
      const [newReleasesCollection, bestSellersCollection, product] = await Promise.all([
        getCollection(homepageContent.newReleases.collectionHandle, {
          first: homepageContent.newReleases.productsCount,
        }).catch(() => null),
        getCollection(homepageContent.bestSellers.collectionHandle, {
          first: 6,
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
  
  // Prepare featured artists data (first 6 for display)
  const featuredArtists = homepageContent.featuredArtists.collections.slice(0, 6).map(artist => ({
    handle: artist.handle,
    name: artist.handle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    location: artist.location,
  }))

  // Note: Header and Footer are provided by app/shop/layout.tsx
  return (
    <main>
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
                  <p className="text-xs text-amber-600 mt-2">
                    To create a Storefront API token: Shopify Admin → Apps → Develop apps → Create an app → Configure Storefront API scopes → Install app
                  </p>
                </div>
              </div>
            </Container>
          </div>
        )}

        {/* Hero Video Section */}
        <VideoPlayer
          video={{
            url: homepageContent.hero.video.url,
            autoplay: homepageContent.hero.video.autoplay,
            loop: true,
            muted: true,
          }}
          overlay={{
            headline: homepageContent.hero.content.headline,
            subheadline: homepageContent.hero.content.subheadline,
            cta: {
              text: homepageContent.hero.cta.text,
              url: homepageContent.hero.cta.url,
              style: homepageContent.hero.cta.style as 'outline',
            },
            textColor: homepageContent.hero.settings.textColor,
            overlayColor: homepageContent.hero.settings.overlayColor,
            overlayOpacity: homepageContent.hero.settings.overlayOpacity,
          }}
          size="full"
          fullWidth={true}
          showControls={true}
        />

        {/* New Releases Section */}
        {newReleases.length > 0 && (
          <SectionWrapper spacing="md" background="default">
            <Container maxWidth="default" paddingX="gutter">
              <SectionHeader
                title={homepageContent.newReleases.title}
                alignment="center"
                action={
                  <Link href={`/shop?collection=${homepageContent.newReleases.collectionHandle}`}>
                    <Button variant="outline" size="sm">
                      {homepageContent.newReleases.linkText}
                    </Button>
                  </Link>
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {newReleases.map((product, index) => (
                  <div
                    key={product.id}
                    className={`animate-fade-in-up ${index % 3 === 1 ? 'animate-fade-in-up-delay-1' : ''} ${index % 3 === 2 ? 'animate-fade-in-up-delay-2' : ''}`}
                  >
                    <ProductCardItem product={product} />
                  </div>
                ))}
              </div>
            </Container>
          </SectionWrapper>
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

        {/* Featured Product Section (Street Lamp) */}
        {featuredProduct && (
          <FeaturedProductSection
            title={featuredProduct.title}
            handle={featuredProduct.handle}
            price={formatPrice(featuredProduct.priceRange.minVariantPrice)}
            compareAtPrice={
              featuredProduct.compareAtPriceRange?.minVariantPrice?.amount
                ? formatPrice(featuredProduct.compareAtPriceRange.minVariantPrice)
                : undefined
            }
            description={featuredProduct.description?.substring(0, 200)}
            media={featuredProduct.images.edges.slice(0, 4).map((edge: any) => ({
              type: 'image' as const,
              url: edge.node.url,
              alt: edge.node.altText || featuredProduct.title,
            }))}
            fullWidth={homepageContent.featuredProduct.fullWidth}
            desktopMediaWidth={homepageContent.featuredProduct.desktopMediaWidth}
            desktopMediaLayout={homepageContent.featuredProduct.desktopMediaLayout as any}
            mobileMediaSize={homepageContent.featuredProduct.mobileMediaSize as any}
            enableVideoAutoplay={homepageContent.featuredProduct.enableVideoAutoplay}
            enableVideoLooping={homepageContent.featuredProduct.enableVideoLooping}
            backgroundColor={homepageContent.featuredProduct.background}
            textColor={homepageContent.featuredProduct.textColor}
          />
        )}

        {/* Secondary Video Section */}
        <VideoPlayer
          video={{
            url: homepageContent.secondaryVideo.video.url,
            autoplay: homepageContent.secondaryVideo.video.autoplay,
            loop: true,
            muted: true,
            poster: homepageContent.secondaryVideo.video.poster,
          }}
          overlay={{
            textColor: homepageContent.secondaryVideo.settings.textColor,
            overlayColor: homepageContent.secondaryVideo.settings.overlayColor,
            overlayOpacity: homepageContent.secondaryVideo.settings.overlayOpacity,
          }}
          size="lg"
          fullWidth={homepageContent.secondaryVideo.settings.fullWidth}
        />

        {/* Press Quotes Section 1 */}
        <PressCarousel
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
        />

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <SectionWrapper spacing="md" background="muted">
            <Container maxWidth="default" paddingX="gutter">
              <SectionHeader
                title={homepageContent.bestSellers.title}
                alignment="center"
                action={
                  <Link href={`/shop?collection=${homepageContent.bestSellers.collectionHandle}`}>
                    <Button variant="outline" size="sm">
                      {homepageContent.bestSellers.linkText}
                    </Button>
                  </Link>
                }
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                {bestSellers.map((product, index) => (
                  <div
                    key={product.id}
                    className={`animate-fade-in-up ${index % 3 === 1 ? 'animate-fade-in-up-delay-1' : ''} ${index % 3 === 2 ? 'animate-fade-in-up-delay-2' : ''}`}
                  >
                    <ProductCardItem product={product} compact />
                  </div>
                ))}
              </div>
            </Container>
          </SectionWrapper>
        )}

        {/* Featured Artists Section */}
        <FeaturedArtistsSection
          title={homepageContent.featuredArtists.title}
          artists={featuredArtists}
          collectionsPerRow={homepageContent.featuredArtists.collectionsPerRow}
          showProgressBar={homepageContent.featuredArtists.showProgressBar}
          fullWidth={homepageContent.featuredArtists.fullWidth}
          linkText="View all artists"
          linkHref="/shop?collection=artists"
        />

        {/* Scrolling Text */}
        <ScrollingText
          text={homepageContent.scrollingText.text}
          textSize={homepageContent.scrollingText.textSize as 'small'}
          textStyle={homepageContent.scrollingText.textStyle as 'fill'}
          scrollingMode={homepageContent.scrollingText.scrollingMode as 'auto'}
          scrollingSpeed={homepageContent.scrollingText.scrollingSpeed}
          fullWidth={homepageContent.scrollingText.fullWidth}
        />

        {/* Press Quotes Section 2 */}
        <PressCarousel
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
  )
}

/**
 * Product Card Item for homepage
 * Uses the enhanced ProductCard with hover image swap
 * Note: onQuickAdd is not passed since this is a Server Component
 */
function ProductCardItem({ 
  product, 
  compact = false 
}: { 
  product: any
  compact?: boolean 
}) {
  const price = formatPrice(product.priceRange.minVariantPrice)
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
    ? formatPrice(product.compareAtPriceRange.minVariantPrice)
    : undefined
  const onSale = isOnSale(product)
  
  // Get second image for hover effect
  const images = product.images?.edges?.map((e: any) => e.node) || []
  const secondImage = images[1]?.url

  return (
    <ProductCard
      title={product.title}
      price={price}
      compareAtPrice={onSale ? compareAtPrice : undefined}
      image={product.featuredImage?.url || ''}
      secondImage={secondImage}
      imageAlt={product.featuredImage?.altText || product.title}
      href={`/shop/${product.handle}`}
      vendor={compact ? undefined : product.vendor}
      vendorHref={product.vendor ? `/shop?collection=${product.vendor.toLowerCase().replace(/\s+/g, '-')}` : undefined}
      transparentBackground={true}
      showQuickAdd={false}
    />
  )
}
