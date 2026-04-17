import { absoluteShopUrl } from '@/lib/seo/site-url'
import { JsonLd } from '@/components/seo/JsonLd'

type ArtistItemLd = {
  name: string
  slug: string
  image?: string
  location?: string
}

type ExploreArtistsJsonLdProps = {
  artists?: ArtistItemLd[]
}

export function ExploreArtistsJsonLd({ artists = [] }: ExploreArtistsJsonLdProps) {
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

  const itemList = {
    '@type': 'ItemList',
    name: 'Street Collector artists',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: artists.length,
    itemListElement: artists.map((a, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: absoluteShopUrl(`/shop/artists/${a.slug}`),
      item: {
        '@type': 'Person',
        name: a.name,
        url: absoluteShopUrl(`/shop/artists/${a.slug}`),
        ...(a.image ? { image: a.image } : {}),
        ...(a.location ? { homeLocation: { '@type': 'Place', name: a.location } } : {}),
      },
    })),
  }

  const graph: Array<Record<string, unknown>> = [breadcrumb]
  if (artists.length > 0) graph.push(itemList)

  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': graph }} />
}
