import type { Metadata } from 'next'
import { getCanonicalSiteOrigin } from '@/lib/seo/site-url'
import {
  getCollectionWithListProducts,
  isStorefrontConfigured,
} from '@/lib/shopify/storefront-client'
import { normalizeShopifyProductId } from '@/lib/shop/shopify-product-id'
import { queryEditionStatesByProductIds } from '@/lib/shop/query-edition-states'
import { mergeEditionStateWithStorefront } from '@/lib/shop/merge-collector-edition-state'
import { getStreetLampProductHandle } from '@/lib/shop/street-lamp-handle'
import { DropsPageClient, type DropRow } from './DropsPageClient'

export const revalidate = 60

export const metadata: Metadata = {
  metadataBase: getCanonicalSiteOrigin(),
  title: 'All drops — limited edition street art | Street Collector',
  description:
    'Browse every active drop: ladder stage, pricing, and availability. Limited edition prints from independent street artists.',
  alternates: { canonical: '/shop/drops' },
  openGraph: {
    title: 'All drops | Street Collector',
    description: 'Limited edition street art drops — filter by ladder stage and discover artists.',
    url: '/shop/drops',
    siteName: 'Street Collector',
    type: 'website',
  },
}

const SEASON_COLLECTION = '2025-edition'

export default async function DropsPage() {
  let rows: DropRow[] = []

  if (isStorefrontConfigured()) {
    try {
      const col = await getCollectionWithListProducts(SEASON_COLLECTION, {
        first: 100,
        sortKey: 'MANUAL',
      }).catch(() => null)
      const lamp = getStreetLampProductHandle().toLowerCase()
      const products =
        col?.products?.edges
          ?.map((e) => e.node)
          .filter(
            (p) =>
              p.handle &&
              p.handle.toLowerCase() !== lamp &&
              !p.handle.toLowerCase().startsWith('street-lamp')
          ) ?? []

      const ids = products
        .map((p) => normalizeShopifyProductId(p.id))
        .filter((x): x is string => Boolean(x))
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n))

      const states = await queryEditionStatesByProductIds(ids)
      const byId = new Map(states.map((s) => [s.productId, s]))

      rows = products.map((p) => {
        const pid = normalizeShopifyProductId(p.id) || ''
        const st = byId.get(pid)
        const merged = mergeEditionStateWithStorefront(p, st)
        return {
          handle: p.handle,
          title: p.title,
          vendor: p.vendor ?? undefined,
          imageUrl: p.featuredImage?.url ?? null,
          productId: pid,
          stageKey: merged.stageKey,
          priceUsd: merged.priceUsd,
          editionsSold: merged.editionsSold,
          editionTotal: merged.editionTotal,
        }
      })
    } catch (e) {
      console.error('[drops page]', e)
    }
  }

  return <DropsPageClient rows={rows} />
}
