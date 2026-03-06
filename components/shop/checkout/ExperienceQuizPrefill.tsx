'use client'

/**
 * ExperienceQuizPrefill
 *
 * Pre-fills checkout address with name and email from the experience intro quiz
 * (localStorage sc-experience-quiz) when address is empty and no logged-in user
 * data has been used. Runs after CheckoutPiiPrefill; only applies when address
 * remains null (e.g. guest checkout after completing the quiz).
 * Must be inside CheckoutProvider.
 */

import { useEffect, useRef } from 'react'
import { useCheckout, type CheckoutAddress } from '@/lib/shop/CheckoutContext'

const QUIZ_STORAGE_KEY = 'sc-experience-quiz'

interface QuizStored {
  name?: string
  email?: string
  ownsLamp?: boolean
  purpose?: string
  completedAt?: string
}

function loadQuizForPrefill(): { name?: string; email?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuizStored
    const name = parsed.name?.trim()
    const email = parsed.email?.trim()
    if (!name && !email) return null
    return { name: name || undefined, email: email || undefined }
  } catch {
    return null
  }
}

export function ExperienceQuizPrefill() {
  const checkout = useCheckout()
  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    if (hasPrefilledRef.current) return
    if (checkout.address !== null) return

    const quiz = loadQuizForPrefill()
    if (!quiz || (!quiz.name && !quiz.email)) return

    hasPrefilledRef.current = true

    const partial: CheckoutAddress = {
      email: quiz.email ?? '',
      fullName: quiz.name ?? '',
      country: 'US',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
    }

    checkout.setAddress(partial)
  }, [checkout.address, checkout.setAddress])

  return null
}
