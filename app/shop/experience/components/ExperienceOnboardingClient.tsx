'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Plus, Info, TicketPercent } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { useExperienceOrder } from '../ExperienceOrderContext'
import { createClient } from '@/lib/supabase/client'
import type { QuizAnswers } from './IntroQuiz'
import type { IntroQuizPartialAnswers } from './IntroQuiz'
import { OrderBar } from './OrderBar'

const IntroQuiz = dynamic(() => import('./IntroQuiz').then((m) => ({ default: m.IntroQuiz })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  ),
})

const ONBOARDING_BASE = '/shop/experience/onboarding'
const QUIZ_STORAGE_KEY = 'sc-experience-quiz'
const EXPERIENCE_CART_KEY = 'sc-experience-cart'

export type OnboardingStep = 1 | 2 | 3 | 4 | 5

function getStepFromPathname(pathname: string): OnboardingStep {
  const base = '/shop/experience/onboarding'
  if (!pathname.startsWith(base)) return 1
  const rest = pathname.slice(base.length).replace(/^\/+/, '')
  if (!rest) return 1
  const num = parseInt(rest, 10)
  if (num >= 1 && num <= 5) return num as OnboardingStep
  return 1
}

function buildOnboardingUrl(step: 1 | 2 | 3 | 4, searchParams: URLSearchParams): string {
  if (step === 1) {
    const q = searchParams.toString()
    return q ? `${ONBOARDING_BASE}?${q}` : ONBOARDING_BASE
  }
  const q = searchParams.toString()
  return q ? `${ONBOARDING_BASE}/${step}?${q}` : `${ONBOARDING_BASE}/${step}`
}

function loadExperienceCart(): { cartOrder: string[]; lampQuantity: number; lampPaywallSkipped: boolean } {
  if (typeof window === 'undefined') return { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false }
  try {
    const raw = localStorage.getItem(EXPERIENCE_CART_KEY)
    if (!raw) return { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false }
    const p = JSON.parse(raw) as Record<string, unknown>
    return {
      cartOrder: Array.isArray(p.cartOrder) ? p.cartOrder : [],
      lampQuantity: typeof p.lampQuantity === 'number' && p.lampQuantity >= 0 ? p.lampQuantity : 0,
      lampPaywallSkipped: !!p.lampPaywallSkipped,
    }
  } catch {
    return { cartOrder: [], lampQuantity: 0, lampPaywallSkipped: false }
  }
}

function loadPartialAnswers(): IntroQuizPartialAnswers {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as Record<string, unknown>
    if (data.completedAt) return {} // completed quiz; don't use as partial
    return {
      ownsLamp: data.ownsLamp as boolean | undefined,
      purpose: data.purpose as 'self' | 'gift' | undefined,
      name: typeof data.name === 'string' ? data.name : undefined,
      email: typeof data.email === 'string' ? data.email : undefined,
    }
  } catch {
    return {}
  }
}

export interface ExperienceOnboardingClientProps {
  lamp: ShopifyProduct
  initialArtistSlug?: string
}

export function ExperienceOnboardingClient({
  lamp,
  initialArtistSlug,
}: ExperienceOnboardingClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setOrderBarProps, orderBarRef } = useExperienceOrder()

  const step = useMemo(() => getStepFromPathname(pathname), [pathname])
  const [partialAnswers, setPartialAnswers] = useState<IntroQuizPartialAnswers>(loadPartialAnswers)

  // Keep partial answers in sync with localStorage (e.g. after navigation)
  useEffect(() => {
    setPartialAnswers(loadPartialAnswers())
  }, [step])

  // OrderBar: empty cart so cart chip works during onboarding
  useEffect(() => {
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
  }, [lamp, setOrderBarProps])

  const handleNext = useCallback(
    (nextStep: 2 | 3 | 4, partial: IntroQuizPartialAnswers) => {
      const toStore = { ...partial, completedAt: undefined }
      try {
        localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(toStore))
      } catch {
        // ignore
      }
      setPartialAnswers(partial)
      router.push(buildOnboardingUrl(nextStep, searchParams))
    },
    [router, searchParams]
  )

  const handleBack = useCallback(() => {
    const prev = (step === 2 ? 1 : step === 3 ? 2 : 3) as 1 | 2 | 3
    router.push(buildOnboardingUrl(prev, searchParams))
  }, [step, router, searchParams])

  const handleComplete = useCallback(
    (answers: QuizAnswers) => {
      try {
        localStorage.setItem(
          QUIZ_STORAGE_KEY,
          JSON.stringify({ ...answers, completedAt: new Date().toISOString() })
        )
      } catch {
        // ignore
      }
      const email = answers.email?.trim()
      if (email) {
        const supabase = createClient()
        supabase
          .from('experience_quiz_signups')
          .insert({
            email,
            name: answers.name?.trim() || null,
            owns_lamp: answers.ownsLamp,
            purpose: answers.purpose,
            source: 'experience',
            affiliate_artist_slug: initialArtistSlug?.trim() || null,
          })
          .then(({ error }) => {
            if (error) console.warn('Experience quiz signup save failed:', error)
          })
      }
      const params = new URLSearchParams(searchParams)
      const q = params.toString()
      router.replace(q ? `/shop/experience?${q}` : '/shop/experience')
    },
    [router, searchParams, initialArtistSlug]
  )

  const handlePaywallAddLamp = useCallback(() => {
    try {
      const cur = loadExperienceCart()
      localStorage.setItem(
        EXPERIENCE_CART_KEY,
        JSON.stringify({
          cartOrder: cur.cartOrder,
          lampQuantity: 1,
          lampPaywallSkipped: false,
        })
      )
    } catch {
      // ignore
    }
    const q = searchParams.toString()
    router.replace(q ? `/shop/experience?${q}` : '/shop/experience')
  }, [router, searchParams])

  const handlePaywallSkip = useCallback(() => {
    try {
      const cur = loadExperienceCart()
      localStorage.setItem(
        EXPERIENCE_CART_KEY,
        JSON.stringify({
          cartOrder: cur.cartOrder,
          lampQuantity: cur.lampQuantity,
          lampPaywallSkipped: true,
        })
      )
    } catch {
      // ignore
    }
    const q = searchParams.toString()
    router.replace(q ? `/shop/experience?${q}` : '/shop/experience')
  }, [router, searchParams])

  const lampPrice = parseFloat(lamp.priceRange?.minVariantPrice?.amount ?? '0')
  const experiencePath = lamp.handle ? `/shop/${lamp.handle}` : '/shop'

  return (
    <>
      <div className="h-full">
        {step === 5 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center min-h-full bg-[#390000]">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center gap-6 max-w-sm"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFBA94]/10">
                <svg viewBox="0 0 306 400" fill="currentColor" className="w-8 h-10 text-[#FFBA94]/80 shrink-0" xmlns="http://www.w3.org/2000/svg">
                  <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                </svg>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-semibold text-[#FFBA94]">
                    Add your Street Lamp
                  </h2>
                  <Link
                    href={experiencePath}
                    className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[#FFBA94]/60 hover:text-[#FFBA94] hover:bg-[#FFBA94]/10 transition-colors"
                    aria-label="View lamp details"
                  >
                    <Info className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-sm text-[#FFBA94]/70">
                  Choose your lamp first, then personalize it with artwork.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePaywallAddLamp}
                style={{ touchAction: 'manipulation' }}
                className="inline-flex items-center gap-2 w-full justify-center px-6 py-4 rounded-xl bg-[#FFBA94] text-[#390000] font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Street Lamp  ${Number.isFinite(lampPrice) ? lampPrice.toFixed(2) : '0.00'}
              </button>
              <p className="flex items-center gap-2 text-sm">
                <TicketPercent className="w-4 h-4 shrink-0 text-emerald-400" aria-hidden />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 bg-clip-text text-transparent font-medium">
                  7.5% Off the Street lamp - for each artwork you add
                </span>
              </p>
              <button
                type="button"
                onClick={handlePaywallSkip}
                style={{ touchAction: 'manipulation' }}
                className="text-xs text-[#FFBA94]/60 hover:text-[#FFBA94]/90 transition-colors underline underline-offset-2"
              >
                Skip — browse artworks without lamp
              </button>
            </motion.div>
          </div>
        ) : (
          <IntroQuiz
            step={step}
            partialAnswers={partialAnswers}
            onNext={handleNext}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        )}
      </div>
      <OrderBar
        ref={orderBarRef}
        lamp={lamp}
        selectedArtworks={[]}
        lampQuantity={0}
        onLampQuantityChange={() => {}}
        onRemoveArtwork={() => {}}
        onSelectArtwork={undefined}
        onViewLampDetail={undefined}
        isGift={false}
      />
    </>
  )
}
