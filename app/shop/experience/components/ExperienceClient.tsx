'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
import type { FilterState } from './FilterPanel'

const QUIZ_STORAGE_KEY = 'sc-experience-quiz'

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

const ONBOARDING_PATH = '/shop/experience/onboarding'

export function ExperienceClient({
  lamp,
  productsSeason1,
  productsSeason2,
  pageInfoSeason1,
  pageInfoSeason2,
  initialArtistSlug,
  skipQuiz = false,
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

  // When user just logged in from onboarding: if authenticated, save quiz (owns lamp) and show configurator
  useEffect(() => {
    if (!fromOnboardingLogin || authLoading) return
    if (isAuthenticated) {
      const loggedInAnswers: QuizAnswers = { ownsLamp: true, purpose: 'self' }
      try {
        localStorage.setItem(
          QUIZ_STORAGE_KEY,
          JSON.stringify({ ...loggedInAnswers, completedAt: new Date().toISOString() })
        )
      } catch {
        // ignore
      }
      setQuizAnswers(loggedInAnswers)
      setMounted(true)
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `/shop/experience?${q}` : '/shop/experience')
    } else {
      setRedirectingToOnboarding(true)
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `${ONBOARDING_PATH}?${q}` : ONBOARDING_PATH)
    }
  }, [fromOnboardingLogin, isAuthenticated, authLoading, router, onboardingQueryParams])

  // When user needs onboarding (no fromOnboardingLogin flow), redirect to onboarding URLs so each step is trackable
  useEffect(() => {
    if (fromOnboardingLogin) return
    const saved = loadQuizAnswers()
    if (saved || skipQuiz) {
      setQuizAnswers(saved ?? { ownsLamp: false, purpose: 'self' })
      setMounted(true)
    } else {
      setRedirectingToOnboarding(true)
      const q = new URLSearchParams(onboardingQueryParams).toString()
      router.replace(q ? `${ONBOARDING_PATH}?${q}` : ONBOARDING_PATH)
    }
  }, [skipQuiz, router, onboardingQueryParams, fromOnboardingLogin])

  const affiliateLandingFired = useRef(false)
  useEffect(() => {
    if (initialArtistSlug && isGAEnabled() && !affiliateLandingFired.current) {
      affiliateLandingFired.current = true
      trackEnhancedEvent('affiliate_landing', { affiliate_slug: initialArtistSlug, page: 'experience' })
    }
  }, [initialArtistSlug])

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

  if (!mounted || redirectingToOnboarding) {
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
    onRemoveArtwork: () => {},
    onSelectArtwork: undefined,
    onViewLampDetail: undefined,
    isGift: false,
  } : null)

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 min-h-0">
        <motion.div
          key="configurator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="h-full"
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
          />
        </motion.div>
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
