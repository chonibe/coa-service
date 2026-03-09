import { Suspense } from 'react'
import Link from 'next/link'
import { getProduct } from '@/lib/shopify/storefront-client'
import { getAffiliateArtistSlugFromSearchParams } from '@/lib/affiliate-tracking'
import { ExperienceOnboardingClient } from '../../components/ExperienceOnboardingClient'

export const dynamic = 'force-dynamic'

interface OnboardingPageProps {
  searchParams: Promise<{ artist?: string; vendor?: string; utm_campaign?: string }>
}

export default async function ExperienceOnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearch = await searchParams
  const fromParams = getAffiliateArtistSlugFromSearchParams({
    artist: resolvedSearch?.artist,
    utm_campaign: resolvedSearch?.utm_campaign,
  })
  const initialArtistSlug = fromParams ?? resolvedSearch?.vendor?.trim() || undefined

  const lamp = await getProduct('street_lamp').catch(() => null)

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

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#390000]">
          <div className="w-8 h-8 border-2 border-[#FFBA94]/30 border-t-[#FFBA94] rounded-full animate-spin" />
        </div>
      }
    >
      <ExperienceOnboardingClient
        lamp={lamp}
        initialArtistSlug={initialArtistSlug}
      />
    </Suspense>
  )
}
