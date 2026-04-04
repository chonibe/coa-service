import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { absoluteShopUrl } from '@/lib/seo/site-url'
import { buildProductFaqPairs } from '@/lib/seo/product-faqs'
import { JsonLd } from '@/components/seo/JsonLd'

type Props = { product: ShopifyProduct }

export function ProductDetailJsonLd({ product }: Props) {
  const url = absoluteShopUrl(`/shop/${product.handle}`)
  const price = product.priceRange?.minVariantPrice?.amount
  const currency = product.priceRange?.minVariantPrice?.currencyCode || 'USD'
  const faqs = buildProductFaqPairs(product)

  const main: Record<string, unknown> = {
    '@type': 'Product',
    name: product.title,
    description: product.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
    image: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
    sku: product.variants?.edges?.[0]?.node?.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Street Collector',
    },
    offers: price
      ? {
          '@type': 'Offer',
          url,
          priceCurrency: currency,
          price,
          availability: product.availableForSale
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        }
      : undefined,
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
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteShopUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: absoluteShopUrl('/shop/products') },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: url,
      },
    ],
  }

  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [main, faqPage, breadcrumb],
      }}
    />
  )
}
