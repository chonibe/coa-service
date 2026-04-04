import { absoluteShopUrl } from '@/lib/seo/site-url'
import { JsonLd } from '@/components/seo/JsonLd'

export function ExploreArtistsJsonLd() {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteShopUrl('/') },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artist directory',
        item: absoluteShopUrl('/shop/explore-artists'),
      },
    ],
  }

  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': [breadcrumb] }} />
}
