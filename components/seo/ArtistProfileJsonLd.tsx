import type { ArtistProfileApiResponse } from '@/lib/shop/artist-profile-api'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { absoluteShopUrl } from '@/lib/seo/site-url'
import { buildArtistFaqPairs } from '@/lib/seo/artist-faqs'
import { JsonLd } from '@/components/seo/JsonLd'

function productOfferSnippet(p: ShopifyProduct): Record<string, unknown> | null {
  const url = absoluteShopUrl(`/shop/${p.handle}`)
  const price = p.priceRange?.minVariantPrice?.amount
  const currency = p.priceRange?.minVariantPrice?.currencyCode || 'USD'
  if (!price) return null
  const availability = p.availableForSale
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'
  return {
    '@type': 'Product',
    name: p.title,
    url,
    image: p.featuredImage?.url ? [p.featuredImage.url] : undefined,
    brand: {
      '@type': 'Brand',
      name: p.vendor || 'Street Collector',
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price,
      availability,
    },
  }
}

type Props = { artist: ArtistProfileApiResponse }

export function ArtistProfileJsonLd({ artist }: Props) {
  const pageUrl = absoluteShopUrl(`/shop/artists/${artist.slug}`)
  const faqs = buildArtistFaqPairs(artist)

  const sameAs = artist.instagramUrl ? [artist.instagramUrl] : undefined

  const person: Record<string, unknown> = {
    '@type': 'Person',
    name: artist.name,
    url: pageUrl,
    image: artist.image,
    sameAs,
    description: artist.bio?.slice(0, 500),
  }

  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteShopUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artists',
        item: absoluteShopUrl('/shop/explore-artists'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: artist.name,
        item: pageUrl,
      },
    ],
  }

  const productNodes = artist.products
    .map(productOfferSnippet)
    .filter((x): x is Record<string, unknown> => x != null)

  const graph: Record<string, unknown>[] = [person, faqPage, breadcrumb, ...productNodes]

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': graph,
      }}
    />
  )
}
