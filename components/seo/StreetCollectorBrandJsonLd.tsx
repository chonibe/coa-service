import { absoluteShopUrl } from '@/lib/seo/site-url'
import { JsonLd } from '@/components/seo/JsonLd'

/** Organization entity for the main Street Collector marketing page (FAQ copy lives in `StreetCollectorFAQ`). */
export function StreetCollectorBrandJsonLd() {
  const pageUrl = absoluteShopUrl('/shop/street-collector')
  const org = {
    '@type': 'Organization',
    name: 'Street Collector',
    url: pageUrl,
    description:
      'Premium illuminated art lamp with swappable limited-edition street art prints from independent artists worldwide.',
  }

  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': [org] }} />
}
