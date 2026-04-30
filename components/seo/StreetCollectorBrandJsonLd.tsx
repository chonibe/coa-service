import { absoluteShopUrl } from '@/lib/seo/site-url'
import { JsonLd } from '@/components/seo/JsonLd'

/** Organization entity for the main Street Collector marketing page (FAQ copy lives in `StreetCollectorFAQ`). */
export function StreetCollectorBrandJsonLd() {
  const homeUrl = absoluteShopUrl('/')
  const org = {
    '@type': 'Organization',
    name: 'Street Collector',
    url: homeUrl,
    logo: absoluteShopUrl('/favicon.ico'),
    description:
      'Premium illuminated art lamp with swappable limited-edition street art prints from independent artists worldwide.',
  }

  const website = {
    '@type': 'WebSite',
    name: 'Street Collector',
    url: homeUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Street Collector',
    },
  }

  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': [org, website] }} />
}
