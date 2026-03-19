'use client'

import dynamic from 'next/dynamic'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface ExperienceV2ClientLoaderProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: PageInfo
  pageInfoSeason2: PageInfo
  /** When set (e.g. from ?artist= URL), fetch spotlight for this artist */
  initialArtistSlug?: string
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-white/50">Loading experience…</p>
      </div>
    </div>
  )
}

const ExperienceV2Client = dynamic(
  () => import('./ExperienceV2Client').then((m) => ({ default: m.ExperienceV2Client })),
  { ssr: false, loading: () => <LoadingSkeleton /> }
)

export function ExperienceV2ClientLoader(props: ExperienceV2ClientLoaderProps) {
  return <ExperienceV2Client {...props} />
}
