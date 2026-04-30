import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { absoluteShopUrl } from '@/lib/seo/site-url'
import { JsonLd } from '@/components/seo/JsonLd'

type Props = {
  products: ShopifyProduct[]
  name: string
  url: string
}

export function ProductListingJsonLd({ products, name, url }: Props) {
  const pageUrl = absoluteShopUrl(url)
  const graph = [
    {
      '@type': 'CollectionPage',
      name,
      url: pageUrl,
      description:
        'Limited edition street art prints and urban art releases from independent artists on Street Collector.',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Street Collector',
        url: absoluteShopUrl('/'),
      },
    },
    {
      '@type': 'ItemList',
      name,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteShopUrl(`/shop/${product.handle}`),
        item: {
          '@type': 'Product',
          name: product.title,
          url: absoluteShopUrl(`/shop/${product.handle}`),
          image: product.featuredImage?.url,
          brand: {
            '@type': 'Brand',
            name: product.vendor || 'Street Collector',
          },
          offers: product.priceRange?.minVariantPrice
            ? {
                '@type': 'Offer',
                price: product.priceRange.minVariantPrice.amount,
                priceCurrency: product.priceRange.minVariantPrice.currencyCode || 'USD',
                availability: product.availableForSale
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
                url: absoluteShopUrl(`/shop/${product.handle}`),
              }
            : undefined,
        },
      })),
    },
  ]

  return <JsonLd id="product-listing-jsonld" data={{ '@context': 'https://schema.org', '@graph': graph }} />
}
