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
} from '@/components/sections'
import { Spline3DViewer, URLParamModal } from '@/components/blocks'
import { homepageContent } from '@/content/homepage'
import { getCollection, formatPrice, isOnSale, getDiscountPercentage } from '@/lib/shopify/storefront-client'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Street Collector - One Lamp, Endless Inspiration',
  description: 'Discover limited edition artworks for the Street Lamp. Collect, swap, and inspire with illuminated art from artists worldwide.',
}

export default async function ShopHomePage() {
  // Fetch featured collections
  const newReleasesCollection = await getCollection(homepageContent.newReleases.collectionHandle, {
    first: homepageContent.newReleases.productsCount,
  })
  
  const bestSellersCollection = await getCollection(homepageContent.bestSellers.collectionHandle, {
    first: 6,
  })

  const newReleases = newReleasesCollection?.products.edges.map(e => e.node) || []
  const bestSellers = bestSellersCollection?.products.edges.map(e => e.node) || []

  // Note: Header and Footer are provided by app/shop/layout.tsx
  return (
    <main>
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
              {newReleases.map((product) => (
                <ProductCardItem key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </SectionWrapper>

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
              {bestSellers.map((product) => (
                <ProductCardItem key={product.id} product={product} compact />
              ))}
            </div>
          </Container>
        </SectionWrapper>

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
