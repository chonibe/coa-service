'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { IntroQuiz, type QuizAnswers } from './IntroQuiz'
import { Configurator } from './Configurator'

const QUIZ_STORAGE_KEY = 'sc-experience-quiz'

interface ExperienceClientProps {
  lamp: ShopifyProduct
  productsSeason1: ShopifyProduct[]
  productsSeason2: ShopifyProduct[]
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

export function ExperienceClient({ lamp, productsSeason1, productsSeason2 }: ExperienceClientProps) {
  const router = useRouter()
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = loadQuizAnswers()
    if (saved) {
      setQuizAnswers(saved)
      setShowQuiz(false)
    } else {
      setShowQuiz(true)
    }
    setMounted(true)
  }, [])

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

  return (
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
          <Configurator
            lamp={lamp}
            productsSeason1={productsSeason1}
            productsSeason2={productsSeason2}
            quizAnswers={quizAnswers ?? { ownsLamp: false, purpose: 'self' }}
            onRetakeQuiz={handleRetakeQuiz}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
