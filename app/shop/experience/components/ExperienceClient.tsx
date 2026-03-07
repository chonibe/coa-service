'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { ComponentErrorBoundary } from '@/components/error-boundaries'
import type { QuizAnswers } from './IntroQuiz'
import { OrderBar } from './OrderBar'

const IntroQuiz = dynamic(() => import('./IntroQuiz').then((m) => ({ default: m.IntroQuiz })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
})

const Configurator = dynamic(() => import('./Configurator').then((m) => ({ default: m.Configurator })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
})
import { useExperienceOrder } from '../ExperienceOrderContext'
import { getStoredAffiliateArtist } from '@/lib/affiliate-tracking'
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

export function ExperienceClient({
  lamp,
  productsSeason1,
  productsSeason2,
  pageInfoSeason1,
  pageInfoSeason2,
  initialArtistSlug,
  skipQuiz = false,
}: ExperienceClientProps) {
  const router = useRouter()
  const { orderBarProps, setOrderBarProps, orderBarRef } = useExperienceOrder()
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [initialFilters, setInitialFilters] = useState<Pick<FilterState, 'artists'> | null>(null)

  // When on quiz, set empty OrderBar props so the drawer can open (cart chip works)
  useEffect(() => {
    if (showQuiz && lamp) {
      setOrderBarProps({
        lamp,
        selectedArtworks: [],
        lampQuantity: 0,
        onLampQuantityChange: () => {},
        onRemoveArtwork: () => {},
        onSelectArtwork: undefined,
        onViewLampDetail: undefined,
        isGift: false,
      })
    }
  }, [showQuiz, lamp, setOrderBarProps])

  useEffect(() => {
    const saved = loadQuizAnswers()
    if (saved || skipQuiz) {
      setQuizAnswers(saved ?? { ownsLamp: false, purpose: 'self' })
      setShowQuiz(false)
    } else {
      setShowQuiz(true)
    }
    setMounted(true)
  }, [skipQuiz])

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

  const handleQuizComplete = (answers: QuizAnswers) => {
    localStorage.setItem(
      QUIZ_STORAGE_KEY,
      JSON.stringify({ ...answers, completedAt: new Date().toISOString() })
    )
    setQuizAnswers(answers)
    setShowQuiz(false)
  }

  const handleRetakeQuiz = useCallback(() => {
    localStorage.removeItem(QUIZ_STORAGE_KEY)
    setShowQuiz(true)
  }, [])

  if (!mounted) {
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
        <AnimatePresence mode="wait">
          {showQuiz ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <IntroQuiz onComplete={handleQuizComplete} />
            </motion.div>
          ) : (
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
              />
            </motion.div>
          )}
        </AnimatePresence>
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
