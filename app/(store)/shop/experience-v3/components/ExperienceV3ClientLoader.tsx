'use client'

import dynamic from 'next/dynamic'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import type { ShopDiscountSettings } from '@/lib/shop/shop-discount-flags'
import { ShopDiscountFlagsProvider } from '@/app/(store)/shop/experience-v2/components/ShopDiscountFlagsContext'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface ExperienceV3ClientLoaderProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: PageInfo
  pageInfoSeason2: PageInfo
  initialArtistSlug?: string
  shopDiscountSettings: ShopDiscountSettings
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <p className="text-sm text-white/50">Loading experience…</p>
      </div>
    </div>
  )
}

const ExperienceV3Client = dynamic(
  () => import('./ExperienceV3Client').then((m) => ({ default: m.ExperienceV3Client })),
  { ssr: false, loading: () => <LoadingSkeleton /> }
)

export function ExperienceV3ClientLoader(props: ExperienceV3ClientLoaderProps) {
  const { shopDiscountSettings, ...rest } = props
  return (
    <ShopDiscountFlagsProvider value={shopDiscountSettings}>
      <ExperienceV3Client {...rest} />
    </ShopDiscountFlagsProvider>
  )
}
