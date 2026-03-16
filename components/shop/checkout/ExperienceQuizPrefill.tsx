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
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'

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
  const { loading: authLoading, user } = useShopAuthContext()
  const hasPrefilledRef = useRef(false)

  useEffect(() => {
    // Wait for auth to resolve so we don't overwrite a logged-in user's profile
    // data with quiz data (race condition fix).
    if (authLoading) return
    // If a user is logged in, CheckoutPiiPrefill will handle the prefill.
    if (user) return
    if (hasPrefilledRef.current) return
    if (checkout.address !== null) return

    const quiz = loadQuizForPrefill()
    if (!quiz || (!quiz.name && !quiz.email)) return

    hasPrefilledRef.current = true

    const partial: CheckoutAddress = {
      email: quiz.email ?? '',
      fullName: quiz.name ?? '',
      // Leave country empty so AddressModal's geo-detection fills it naturally
      // for international users instead of defaulting to US.
      country: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      phoneCountryCode: '+1',
      phoneNumber: '',
    }

    checkout.setAddress(partial)
  }, [authLoading, user, checkout.address, checkout.setAddress])

  return null
}
