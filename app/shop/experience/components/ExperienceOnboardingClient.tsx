'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
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

function getStepFromPathname(pathname: string): 1 | 2 | 3 | 4 {
  const base = '/shop/experience/onboarding'
  if (!pathname.startsWith(base)) return 1
  const rest = pathname.slice(base.length).replace(/^\/+/, '')
  if (!rest) return 1
  const num = parseInt(rest, 10)
  if (num >= 1 && num <= 4) return num as 1 | 2 | 3 | 4
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

  return (
    <>
      <div className="h-full">
        <IntroQuiz
          step={step}
          partialAnswers={partialAnswers}
          onNext={handleNext}
          onBack={handleBack}
          onComplete={handleComplete}
        />
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
