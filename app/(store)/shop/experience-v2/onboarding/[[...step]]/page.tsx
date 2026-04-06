import { Suspense } from 'react'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getProduct } from '@/lib/shopify/storefront-client'
import { getAffiliateArtistSlugFromSearchParams } from '@/lib/affiliate-tracking'
import { ExperienceOnboardingClient } from '../../components/ExperienceOnboardingClient'
import { getShopDiscountSettings } from '@/lib/shop/get-shop-discount-flags'
import { ShopDiscountFlagsProvider } from '../../components/ShopDiscountFlagsContext'

export const dynamic = 'force-dynamic'

// Cache lamp product for 5 minutes — same cache key as the main experience page so
// both pages share a single warm cache entry. force-dynamic is still required for
// searchParams (affiliate tracking), but product data doesn't need to be live.
const getCachedLamp = unstable_cache(
  () => getProduct('street_lamp'),
  ['experience-lamp'],
  { revalidate: 300, tags: ['experience-products'] }
)

interface OnboardingPageProps {
  searchParams: Promise<{ artist?: string; vendor?: string; utm_campaign?: string }>
}

export default async function ExperienceOnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearch = await searchParams
  const fromParams = getAffiliateArtistSlugFromSearchParams({
    artist: resolvedSearch?.artist,
    utm_campaign: resolvedSearch?.utm_campaign,
  })
  const initialArtistSlug = (fromParams ?? resolvedSearch?.vendor?.trim()) || undefined

  const lamp = await getCachedLamp().catch(() => null)

  if (!lamp) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#390000] text-[#FFBA94]">
        <div className="text-center max-w-md px-6">
          <h1 className="text-2xl font-semibold mb-3">Unavailable</h1>
          <p className="text-[#FFBA94]/80 mb-6">
            Could not load the lamp product. Please try again later.
          </p>
          <Link
            href="/shop"
            className="inline-block px-6 py-2.5 bg-[#FFBA94] text-[#390000] rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  const shopDiscountSettings = await getShopDiscountSettings()

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#390000]">
          <div className="w-8 h-8 border-2 border-[#FFBA94]/30 border-t-[#FFBA94] rounded-full animate-spin" />
        </div>
      }
    >
      <ShopDiscountFlagsProvider value={shopDiscountSettings}>
        <ExperienceOnboardingClient
          lamp={lamp}
          initialArtistSlug={initialArtistSlug}
        />
      </ShopDiscountFlagsProvider>
    </Suspense>
  )
}
