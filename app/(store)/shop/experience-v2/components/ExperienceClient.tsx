'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import type { QuizAnswers } from './IntroQuiz'
import { OrderBar } from './OrderBar'

const Configurator = dynamic(() => import('./Configurator').then((m) => ({ default: m.Configurator })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
})
import { useExperienceOrder } from '../ExperienceOrderContext'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { getStoredAffiliateArtist } from '@/lib/affiliate-tracking'
import { trackEnhancedEvent, isGAEnabled } from '@/lib/google-analytics'
import { captureFunnelEvent, FunnelEvents, getDeviceType, setUserProperty } from '@/lib/posthog'
import type { FilterState } from './FilterPanel'

const QUIZ_STORAGE_KEY = 'sc-experience-quiz'
const AB_COOKIE_NAME = 'sc_experience_ab'
const AB_COOKIE_MAX_AGE_DAYS = 30

type ABVariant = 'onboarding' | 'skip'

function getABVariantFromCookie(): ABVariant | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${AB_COOKIE_NAME}=([^;]*)`))
  const v = match?.[1]?.trim()
  if (v === 'onboarding' || v === 'skip') return v
  return null
}

function setABVariantCookie(variant: ABVariant) {
  if (typeof document === 'undefined') return
  const maxAge = AB_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  document.cookie = `${AB_COOKIE_NAME}=${variant}; path=/; max-age=${maxAge}; samesite=lax`
}

function ExperienceConfiguratorWithBoundary(
  props: React.ComponentProps<typeof Configurator>
) {
  const [retryKey, setRetryKey] = useState(0)
  return (
    <ComponentErrorBoundary
      key={retryKey}
      componentName="Configurator"
      fallback={
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-950 px-6">
          <p className="text-center text-white/80">
            Something went wrong loading the configurator.
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-neutral-950 hover:bg-neutral-100 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/shop"
            className="text-sm text-white/50 hover:text-white/70 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      }
    >
      <Configurator {...props} />
    </ComponentErrorBoundary>
  )
}

export interface SeasonPageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface ExperienceClientProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
  pageInfoSeason1: SeasonPageInfo
  pageInfoSeason2: SeasonPageInfo
  /** Artist slug from ?artist= to pre-filter artworks (e.g. from Instagram link) */
  initialArtistSlug?: string
  /** When true, skip intro quiz and go straight to configurator (default: true when artist link) */
  skipQuiz?: boolean
  /** When true, user arrived via a direct ad link (?direct=1); skips quiz, lamp paywall still shown */
  directEntry?: boolean
  /** Named ad preset key (?preset=X); drives the bundle grid layout in Configurator */
  adPreset?: string
  /** When true, request spotlight with unlisted=1 so API returns unlisted (early access UI) */
  forceUnlisted?: boolean
  /** Query params to preserve when redirecting to onboarding (e.g. artist, utm_campaign) for trackable URLs */
  onboardingQueryParams?: Record<string, string>
  /** When true, user just logged in from onboarding; if authenticated, save quiz (owns lamp) and skip onboarding */
  fromOnboardingLogin?: boolean
}

function loadQuizAnswers(): QuizAnswers | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as QuizAnswers
  } catch {
    return null
  }
}

const ONBOARDING_PATH = '/shop/experience-v2/onboarding'

export function ExperienceClient({
  lamp,
  productsSeason1,
  productsSeason2,
  pageInfoSeason1,
  pageInfoSeason2,
  initialArtistSlug,
  skipQuiz = false,
  directEntry = false,
  adPreset,
  forceUnlisted = false,
  onboardingQueryParams = {},
  fromOnboardingLogin = false,
}: ExperienceClientProps) {
  const router = useRouter()
  const { orderBarProps, setOrderBarProps, orderBarRef } = useExperienceOrder()
  const { isAuthenticated, loading: authLoading } = useShopAuthContext()
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
  const [mounted, setMounted] = useState(false)
  const [redirectingToOnboarding, setRedirectingToOnboarding] = useState(false)
  const [initialFilters, setInitialFilters] = useState<Pick<FilterState, 'artists'> | null>(null)
  // Read A/B cookie synchronously on first render to eliminate the 2-render-cycle waterfall.
  // New visitors (no cookie) get null here; the useEffect below assigns and persists the variant.
  const [abVariant, setABVariant] = useState<ABVariant | null>(() => getABVariantFromCookie())

  // Fetch early access coupon if early access link is detected (requires token)
  useEffect(() => {
    if ((forceUnlisted || initialArtistSlug) && initialArtistSlug) {
      // Check for token in URL
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      
      if (token) {
        async function fetchEarlyAccessCoupon() {
          try {
            const response = await fetch(`/api/shop/early-access-coupon?artist=${encodeURIComponent(initialArtistSlug!)}&token=${encodeURIComponent(token)}`)
            if (response.ok) {
              const data = await response.json()
              // Cookie is set by the API; coupon code intentionally not logged
            } else {
              console.warn('Early access token invalid or expired')
            }
          } catch (error) {
            console.error('Error fetching early access coupon:', error)
          }
        }
        fetchEarlyAccessCoupon()
      }
    }
  }, [forceUnlisted, initialArtistSlug])

  // A/B test: assign variant for new visitors (no cookie) and fire analytics.
  // Returning visitors already have abVariant set from the useState lazy initializer above —
  // this effect only runs assignment logic for new visitors (abVariant === null on mount).
  const abAssigned = useRef(false)
  useEffect(() => {
    if (abAssigned.current) return
    abAssigned.current = true
    const existingVariant = abVariant
    const isNewAssignment = !existingVariant
    const variant: ABVariant = existingVariant ?? (Math.random() < 0.5 ? 'skip' : 'onboarding')
    if (isNewAssignment) {
      setABVariantCookie(variant)
      if (isGAEnabled()) {
        trackEnhancedEvent('experience_ab_assigned', { variant, test: 'experience_onboarding' })
        try {
          window.gtag?.('set', 'user_properties', { experience_ab_variant: variant })
        } catch {
          // ignore
        }
      }
      fetch('/api/experience/ab-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant }),
        credentials: 'include',
      }).catch(() => {})
      setABVariant(variant)
    }
    // Mirror A/B variant to PostHog so session replays, funnels, and heatmaps can be segmented by variant
    captureFunnelEvent('experience_ab_variant_known', {
      variant,
      is_new_assignment: isNewAssignment,
      device_type: getDeviceType(),
    })
    setUserProperty('experience_ab_variant', variant as string)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When user just logged in from onboarding: if authenticated, save quiz (owns lamp) and show configurator
  useEffect(() => {
    if (!fromOnboardingLogin || authLoading) return
    if (isAuthenticated) {
      const loggedInAnswers: QuizAnswers = { ownsLamp: true, purpose: 'self' }
      try {
        localStorage.setItem(
          QUIZ_STORAGE_KEY,
          JSON.stringify({
            ...loggedInAnswers,
            completedAt: new Date().toISOString(),
            quizLoginBypass: true as const,
          })
        )
      } catch {
        // ignore
      }
      setQuizAnswers(loggedInAnswers)
      setMounted(true)
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `/shop/experience-v2?${q}` : '/shop/experience-v2')
    } else {
      setRedirectingToOnboarding(true)
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `${ONBOARDING_PATH}?${q}` : ONBOARDING_PATH)
    }
  }, [fromOnboardingLogin, isAuthenticated, authLoading, router, onboardingQueryParams])

  // When user needs onboarding (no fromOnboardingLogin flow), redirect to onboarding or show configurator (A/B: half skip)
  const effectiveSkipQuiz = skipQuiz || directEntry || abVariant === 'skip'
  useEffect(() => {
    if (fromOnboardingLogin || abVariant === null) return
    const saved = loadQuizAnswers()
    if (saved || effectiveSkipQuiz) {
      // directEntry (ad traffic) always treats the user as not owning a lamp so the paywall card always shows
      const answers = saved ?? { ownsLamp: false, purpose: 'self' as const }
      setQuizAnswers(directEntry ? { ...answers, ownsLamp: false } : answers)
      setMounted(true)
    } else {
      setRedirectingToOnboarding(true)
      captureFunnelEvent(FunnelEvents.experience_redirected_to_onboarding, {
        reason: 'no_quiz_answers',
        ab_variant: abVariant ?? undefined,
        device_type: getDeviceType(),
      })
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `${ONBOARDING_PATH}?${q}` : ONBOARDING_PATH)
    }
  }, [effectiveSkipQuiz, abVariant, router, onboardingQueryParams, fromOnboardingLogin])

  const affiliateLandingFired = useRef(false)
  useEffect(() => {
    if (initialArtistSlug && isGAEnabled() && !affiliateLandingFired.current) {
      affiliateLandingFired.current = true
      trackEnhancedEvent('affiliate_landing', { affiliate_slug: initialArtistSlug, page: 'experience' })
    }
  }, [initialArtistSlug])

  // Link experience_quiz_signups to current user when authenticated (adds collector_user_id to table)
  const linkSignupFired = useRef(false)
  useEffect(() => {
    if (!mounted || !isAuthenticated || linkSignupFired.current) return
    linkSignupFired.current = true
    fetch('/api/experience/quiz-signup/link', { method: 'POST', credentials: 'include' }).catch(() => {})
  }, [mounted, isAuthenticated])

  // Funnel: experience started (configurator shown)
  const experienceStartedFired = useRef(false)
  useEffect(() => {
    if (!mounted || !quizAnswers || experienceStartedFired.current) return
    experienceStartedFired.current = true
    captureFunnelEvent(FunnelEvents.experience_started, {
      owns_lamp: quizAnswers.ownsLamp,
      purpose: quizAnswers.purpose,
      device_type: getDeviceType(),
    })
  }, [mounted, quizAnswers])

  // Analytics: track direct ad entry (?direct=1)
  const directEntryFired = useRef(false)
  useEffect(() => {
    if (!directEntry || !mounted || directEntryFired.current) return
    directEntryFired.current = true
    captureFunnelEvent('experience_direct_entry', {
      artist_slug: initialArtistSlug ?? undefined,
      device_type: getDeviceType(),
    })
  }, [directEntry, mounted, initialArtistSlug])

  // Resolve artist slug to vendor name for initial filter (from URL param or stored affiliate)
  useEffect(() => {
    const slug = initialArtistSlug || (mounted ? getStoredAffiliateArtist() : null)
    if (!slug || !mounted) return
    let cancelled = false
    fetch(`/api/shop/artists/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.name) return
        setInitialFilters({ artists: [data.name] })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [initialArtistSlug, mounted])

  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      // Allow context menu on the Spline 3D area so its controls work; block elsewhere
      const target = e.target as Element | null
      if (target?.closest?.('[data-wizard-spline]')) return
      e.preventDefault()
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.push('/shop')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleRetakeQuiz = useCallback(() => {
    localStorage.removeItem(QUIZ_STORAGE_KEY)
    const q = new URLSearchParams(onboardingQueryParams).toString()
    router.push(q ? `${ONBOARDING_PATH}?${q}` : ONBOARDING_PATH)
  }, [router, onboardingQueryParams])

  const waitingForAB = !fromOnboardingLogin && abVariant === null
  if (!mounted || redirectingToOnboarding || waitingForAB) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  // OrderBar props: from Configurator when on configurator, or empty defaults when on quiz
  const effectiveOrderBarProps = orderBarProps ?? (lamp ? {
    lamp,
    selectedArtworks: [] as ShopifyProduct[],
    lampQuantity: 0,
    onLampQuantityChange: () => {},
    onAdjustArtworkQuantity: () => {},
    onSelectArtwork: undefined,
    onViewLampDetail: undefined,
    isGift: false,
  } : null)

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 min-h-0">
        <div
          key="configurator"
          className="h-full animate-fade-in"
        >
          <ExperienceConfiguratorWithBoundary
            lamp={lamp}
            productsSeason1={productsSeason1}
            productsSeason2={productsSeason2}
            pageInfoSeason1={pageInfoSeason1}
            pageInfoSeason2={pageInfoSeason2}
            quizAnswers={quizAnswers ?? { ownsLamp: false, purpose: 'self' }}
            onRetakeQuiz={handleRetakeQuiz}
            initialFilters={initialFilters}
            initialArtistSlug={initialArtistSlug}
            forceUnlisted={forceUnlisted}
            forceShowLampPaywall={abVariant === 'skip' || directEntry}
            adPreset={adPreset}
          />
        </div>
      </div>
      {/* OrderBar is always mounted so cart chip opens drawer even during quiz */}
      {effectiveOrderBarProps && (
        <OrderBar
          ref={orderBarRef}
          {...effectiveOrderBarProps}
        />
      )}
    </div>
  )
}
