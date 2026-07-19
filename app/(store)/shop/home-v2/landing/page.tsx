import { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import { homeV2LandingContent } from '@/content/home-v2-landing'
import { landingFontVariables } from '../landing-fonts'
import styles from '../landing.module.css'
import { LandingNav } from '../components/LandingNav'
import { LandingHero } from '../components/LandingHero'
import { TrustBar } from '../components/TrustBar'
import { StepsSection } from '../components/StepsSection'
import { ArtistsWall } from '../components/ArtistsWall'
import {
  BestSellersScrollGallery,
  type BestSellerGalleryItem,
} from '../components/BestSellersScrollGallery'
import { TestimonialsSection } from '../components/TestimonialsSection'
import { GuaranteeSection } from '../components/GuaranteeSection'
import { FaqSectionLanding } from '../components/FaqSectionLanding'
import { FinalCta } from '../components/FinalCta'
import { MobileStickyCta } from '@/components/shop/MobileStickyCta'
import { WelcomeIncentiveStrip } from '@/components/shop/WelcomeIncentiveStrip'
import { getYotpoStoreReviewSummary } from '@/lib/shop/yotpo-store-reviews'
import { JsonLd } from '@/components/seo/JsonLd'
import {
  getCollectionWithListProducts,
  isStorefrontConfigured,
  type ShopifyProduct,
} from '@/lib/shopify/storefront-client'
import { getVendorCollectionHandle } from '@/lib/shopify/vendor-collection-handle'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { queryEditionStatesByProductIds } from '@/lib/shop/query-edition-states'
import { mergeEditionStateWithStorefront } from '@/lib/shop/merge-collector-edition-state'
import { experienceArtworkUnitUsd } from '@/lib/shop/experience-artwork-unit-price'
import { computeReservedEditionNumber } from '@/lib/shop/compute-cart-edition-reserve'
import { getProductEditionSize } from '@/lib/shop/edition-stages'
import type { EditionStateItem } from '@/lib/shop/query-edition-states'

const LANDING_TITLE =
  'Street Collector — Not Just a Lamp. A Living Art Collection.'
const LANDING_DESCRIPTION =
  'A backlit lamp built for interchangeable street art prints. Collect, swap, and build the collection over time.'

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: LANDING_TITLE,
  description: LANDING_DESCRIPTION,
  alternates: {
    canonical: '/shop/home-v2',
  },
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    url: '/shop/home-v2',
    siteName: 'Street Collector',
    type: 'website',
    images: [
      {
        url: homeV2LandingContent.urls.openGraphImageUrl,
        alt: 'Street Collector lamp and art collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [homeV2LandingContent.urls.openGraphImageUrl],
  },
}

export const revalidate = 600

function filterArtworkProducts(products: ShopifyProduct[]) {
  return products.filter(
    (p) => p.handle !== 'street_lamp' && !p.handle?.startsWith('street-lamp')
  )
}

function getNextEditionForSale(
  product: ShopifyProduct,
  merged: EditionStateItem
): { nextEditionNumber: number; editionTotal: number } | null {
  const editionTotal = merged.editionTotal ?? getProductEditionSize(product)
  if (editionTotal == null || editionTotal < 2) return null
  if (!product.availableForSale || merged.editionsSold >= editionTotal) return null

  const nextEditionNumber = Math.min(
    editionTotal,
    computeReservedEditionNumber(merged.editionsSold, 0)
  )
  if (nextEditionNumber < 1) return null

  return { nextEditionNumber, editionTotal }
}

function toBestSellerGalleryItem(
  product: ShopifyProduct,
  streetLadderPrices: Record<string, number>,
  merged: EditionStateItem
): BestSellerGalleryItem {
  const vendor = product.vendor?.trim() || null
  const artistSlug = vendor ? getVendorCollectionHandle(vendor) : null
  const edition = getNextEditionForSale(product, merged)

  return {
    product,
    artistSlug,
    priceUsd: experienceArtworkUnitUsd(product, {
      streetLadderUsdByProductId: streetLadderPrices,
      seasonBandsFallback: 2,
    }),
    nextEditionNumber: edition?.nextEditionNumber ?? null,
    editionTotal: edition?.editionTotal ?? null,
  }
}

async function loadBestSellerGalleryItems(): Promise<BestSellerGalleryItem[]> {
  if (!isStorefrontConfigured()) return []

  try {
    const collection = await getCollectionWithListProducts(
      homeV2LandingContent.bestSellers.collectionHandle,
      {
        first: homeV2LandingContent.bestSellers.productsCount,
        sortKey: 'MANUAL',
      }
    )
    const products = filterArtworkProducts(
      collection?.products?.edges?.map((edge) => edge.node) ?? []
    )
    if (products.length === 0) return []

    const numericIds = products
      .map((product) => normalizeShopifyProductId(product.id))
      .filter((id): id is string => Boolean(id))
      .map((id) => parseInt(id, 10))
      .filter((id) => Number.isFinite(id))

    const editionStates = await queryEditionStatesByProductIds(numericIds).catch(() => [])
    const editionStateById = new Map(editionStates.map((state) => [state.productId, state]))

    const streetLadderPrices: Record<string, number> = {}
    for (const product of products) {
      const productId = normalizeShopifyProductId(product.id) || ''
      const merged = mergeEditionStateWithStorefront(product, editionStateById.get(productId))
      if (merged.priceUsd != null && merged.priceUsd > 0) {
        streetLadderPrices[productId] = merged.priceUsd
      }
    }

    return products.map((product) => {
      const productId = normalizeShopifyProductId(product.id) || ''
      const merged = mergeEditionStateWithStorefront(product, editionStateById.get(productId))
      return toBestSellerGalleryItem(product, streetLadderPrices, merged)
    })
  } catch (error) {
    console.error('Home landing best sellers fetch error:', error)
    return []
  }
}

function buildLandingJsonLd() {
  const origin = getCanonicalSiteOrigin().toString().replace(/\/$/, '')
  const pageUrl = `${origin}/shop/home-v2/landing`
  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeV2LandingContent.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  const videoObject = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Street Collector — A Living Art Collection',
    description: LANDING_DESCRIPTION,
    thumbnailUrl: [
      ('videoPosterUrl' in homeV2LandingContent.hero
        ? (homeV2LandingContent.hero as { videoPosterUrl?: string }).videoPosterUrl
        : undefined) ?? homeV2LandingContent.urls.openGraphImageUrl,
    ],
    contentUrl: homeV2LandingContent.hero.videoUrl,
    uploadDate: '2024-01-01',
  }
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: pageUrl,
    name: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Street Collector',
      url: origin,
    },
  }
  return [webPage, faqPage, videoObject]
}

export default async function HomeV2LandingPage() {
  const [bestSellerItems, reviewSummary] = await Promise.all([
    loadBestSellerGalleryItems(),
    getYotpoStoreReviewSummary().catch(() => null),
  ])

  return (
    <div className={`${styles.page} ${landingFontVariables}`}>
      <JsonLd id="landing-jsonld" data={buildLandingJsonLd()} />
      <LandingNav />
      <WelcomeIncentiveStrip tone="dark" />
      <main>
        <LandingHero reviewSummary={reviewSummary} />
        <TrustBar />
        <StepsSection />
        <ArtistsWall />
        <BestSellersScrollGallery items={bestSellerItems} />
        <TestimonialsSection reviewSummary={reviewSummary} />
        <GuaranteeSection />
        <FaqSectionLanding />
        <FinalCta />
      </main>
      <MobileStickyCta
        href={homeV2LandingContent.urls.experience}
        label={homeV2LandingContent.hero.ctaText}
        breakpoint="960"
      />
    </div>
  )
}
