'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Sparkles, User, Gift, ArrowLeft } from 'lucide-react'
import { captureFunnelEvent, FunnelEvents, getDeviceType } from '@/lib/posthog'

export interface QuizAnswers {
  ownsLamp: boolean
  purpose: 'self' | 'gift'
  /** User's name from onboarding (gift giver or self) */
  name?: string
  /** Optional email from onboarding */
  email?: string
}

export type IntroQuizPartialAnswers = Partial<Pick<QuizAnswers, 'ownsLamp' | 'purpose'>> & { name?: string; email?: string }

interface IntroQuizProps {
  onComplete: (answers: QuizAnswers) => void
  /** When set, quiz is driven by URL: only this step is shown and navigation uses onNext/onBack */
  step?: 1 | 2 | 3
  /** Pre-filled values when using URL mode (e.g. from localStorage) */
  partialAnswers?: IntroQuizPartialAnswers
  /** Called when user continues to next step (URL mode only). Parent should navigate and pass updated partialAnswers next render. */
  onNext?: (nextStep: 2 | 3, partial: IntroQuizPartialAnswers) => void
  /** Called when user taps back (URL mode only). Parent should navigate to previous step. */
  onBack?: () => void
  /** When set, step 1 shows "Already have an account? Log in" and calls this when clicked (skip onboarding for returning users) */
  onOpenLogin?: () => void
}

// Opacity-only fade — no y offset to avoid contributing to CLS.
// The y: 30 shift previously caused layout instability before the element settled.
const fadeUp = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, transition: { duration: 0.25 } },
}

export function IntroQuiz({ onComplete, step: urlStep, partialAnswers, onNext, onBack, onOpenLogin }: IntroQuizProps) {
  const isUrlMode = urlStep != null
  const [internalStep, setInternalStep] = useState<1 | 2 | 3>(1)
  const [ownsLamp, setOwnsLamp] = useState<boolean | null>(partialAnswers?.ownsLamp ?? null)
  const [purpose, setPurpose] = useState<'self' | 'gift' | null>(partialAnswers?.purpose ?? null)
  const [name, setName] = useState(partialAnswers?.name ?? '')

  const step = isUrlMode ? urlStep : internalStep
  const stepStartTimeRef = useRef<number>(Date.now())
  const completedRef = useRef(false)

  useEffect(() => {
    // Include device_type and default values for owns_lamp and purpose
    // This ensures all users have these properties set, preventing 0% completion rates
    captureFunnelEvent(FunnelEvents.experience_quiz_started, {
      device_type: getDeviceType(),
      owns_lamp: ownsLamp ?? false, // Default to false if not yet selected
      purpose: purpose ?? 'self', // Default to 'self' if not yet selected
    })
  }, [])

  // Track step views and time spent — fires on every step change
  useEffect(() => {
    stepStartTimeRef.current = Date.now()
    // Use step_number property (not step) for PostHog funnel filtering
    captureFunnelEvent(FunnelEvents.onboarding_step_viewed, {
      step_number: step, // Use step_number for PostHog funnel queries
      step, // Keep step for backward compatibility
      context: 'experience_quiz',
      device_type: getDeviceType(),
      owns_lamp: ownsLamp ?? false,
      purpose: purpose ?? 'self',
    })

    return () => {
      // Only fire abandoned if the quiz wasn't completed AND the user has
      // actually navigated away from the quiz (not just moved to the next step).
      // In URL mode each step change causes a cleanup, so we check the current
      // pathname to avoid false "abandoned" events on normal forward navigation.
      const stillInQuiz =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/shop/experience-v2/onboarding')
      if (!completedRef.current && !stillInQuiz) {
        const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000)
        if (timeSpent > 1) {
          captureFunnelEvent(FunnelEvents.onboarding_step_abandoned, {
            step_number: step,
            step,
            context: 'experience_quiz',
            time_spent_seconds: timeSpent,
            device_type: getDeviceType(),
            owns_lamp: ownsLamp ?? false,
            purpose: purpose ?? 'self',
          })
        }
      }
    }
  }, [step, ownsLamp, purpose])

  // Sync partialAnswers into state when in URL mode (e.g. back/forward)
  useEffect(() => {
    if (!isUrlMode) return
    if (partialAnswers?.ownsLamp !== undefined) setOwnsLamp(partialAnswers.ownsLamp)
    if (partialAnswers?.purpose !== undefined) setPurpose(partialAnswers.purpose)
    if (partialAnswers?.name !== undefined) setName(partialAnswers.name)
  }, [isUrlMode, partialAnswers?.ownsLamp, partialAnswers?.purpose, partialAnswers?.name])

  const handleStep1 = (owns: boolean) => {
    const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000)
    captureFunnelEvent(FunnelEvents.experience_quiz_step_completed, {
      step: 1,
      step_number: 1, // Add step_number for PostHog queries
      answer: owns ? 'has_lamp' : 'no_lamp',
      time_spent_seconds: timeSpent,
      device_type: getDeviceType(),
      owns_lamp: owns,
      purpose: purpose ?? 'self',
    })
    captureFunnelEvent(FunnelEvents.onboarding_step_interaction, {
      step: 1,
      step_number: 1, // Add step_number for PostHog queries
      button_type: owns ? 'owns_lamp_yes' : 'owns_lamp_no',
      context: 'experience_quiz',
      device_type: getDeviceType(),
      owns_lamp: owns,
      purpose: purpose ?? 'self',
    })
    if (isUrlMode && onNext) {
      onNext(2, { ...partialAnswers, ownsLamp: owns })
      return
    }
    setOwnsLamp(owns)
    setInternalStep(2)
  }

  const handleStep2 = (p: 'self' | 'gift') => {
    const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000)
    captureFunnelEvent(FunnelEvents.experience_quiz_step_completed, {
      step: 2,
      step_number: 2, // Add step_number for PostHog queries
      answer: p,
      time_spent_seconds: timeSpent,
      device_type: getDeviceType(),
      owns_lamp: ownsLamp ?? false,
      purpose: p,
    })
    captureFunnelEvent(FunnelEvents.onboarding_step_interaction, {
      step: 2,
      step_number: 2, // Add step_number for PostHog queries
      button_type: p === 'self' ? 'purpose_self' : 'purpose_gift',
      context: 'experience_quiz',
      device_type: getDeviceType(),
      owns_lamp: ownsLamp ?? false,
      purpose: p,
    })
    if (isUrlMode && onNext) {
      onNext(3, { ...partialAnswers, ownsLamp: ownsLamp ?? false, purpose: p })
      return
    }
    setPurpose(p)
    setInternalStep(3)
  }

  const handleStep3 = () => {
    completedRef.current = true
    const answers: QuizAnswers = {
      ownsLamp: ownsLamp ?? false,
      purpose: purpose ?? 'self',
      name: name.trim() || undefined,
    }
    captureFunnelEvent(FunnelEvents.experience_quiz_completed, {
      owns_lamp: answers.ownsLamp,
      purpose: answers.purpose,
      provided_name: !!answers.name,
      device_type: getDeviceType(),
    })
    onComplete(answers)
  }

  const handleBack = () => {
    if (isUrlMode && onBack) {
      onBack()
      return
    }
    if (internalStep === 2) setInternalStep(1)
    else if (internalStep === 3) setInternalStep(2)
  }

  return (
    <div className="relative flex h-full items-center justify-center bg-[#390000] px-4">
      {/* Back button for steps 2–4 */}
      {step >= 2 && (
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFBA94]/25 hover:bg-[#FFBA94]/35 text-[#FFBA94] transition-colors border border-[#FFBA94]/20"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center gap-10 max-w-lg w-full"
          >
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-[#FFBA94]/60 mb-3">Step 1 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#FFBA94] tracking-tight">
                Let&rsquo;s get started
              </h1>
              <p className="text-[#FFBA94]/50 mt-2 text-lg">Do you already have a Street Lamp?</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,186,148,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep1(true)}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 text-[#FFBA94] transition-colors cursor-pointer"
              >
                <Lightbulb className="w-8 h-8" />
                <span className="text-sm font-medium">Yes, I do</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,186,148,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep1(false)}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 text-[#FFBA94] transition-colors cursor-pointer"
              >
                <Sparkles className="w-8 h-8" />
                <span className="text-sm font-medium">I&rsquo;m new here</span>
              </motion.button>
            </div>

            <div className="flex flex-col items-center gap-2">
              {onOpenLogin && (
                <button
                  type="button"
                  onClick={() => {
                    captureFunnelEvent(FunnelEvents.experience_onboarding_login_clicked, { step: 1 })
                    onOpenLogin()
                  }}
                  className="text-sm text-[#FFBA94]/80 hover:text-[#FFBA94] underline underline-offset-2 transition-colors"
                >
                  Already have an account? Log in
                </button>
              )}
              <button
                onClick={() => {
                  completedRef.current = true
                  captureFunnelEvent(FunnelEvents.experience_quiz_skipped, {
                    at_step: step,
                    step_number: step, // Add step_number for PostHog queries
                    device_type: getDeviceType(),
                    owns_lamp: ownsLamp ?? false,
                    purpose: purpose ?? 'self',
                  })
                  onComplete({ ownsLamp: false, purpose: 'self' })
                }}
                className="text-xs text-[#FFBA94]/50 hover:text-[#FFBA94]/70 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center gap-10 max-w-lg w-full"
          >
            <div className="text-center">
              <p className="text-sm uppercase tracking-widest text-[#FFBA94]/60 mb-3">Step 2 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#FFBA94] tracking-tight">
                Who is this for?
              </h1>
              <p className="text-[#FFBA94]/50 mt-2 text-lg">Help us personalize your experience</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,186,148,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep2('self')}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 text-[#FFBA94] transition-colors cursor-pointer"
              >
                <User className="w-8 h-8" />
                <span className="text-sm font-medium">For me</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,186,148,0.2)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep2('gift')}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 text-[#FFBA94] transition-colors cursor-pointer"
              >
                <Gift className="w-8 h-8" />
                <span className="text-sm font-medium">It&rsquo;s a gift</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center gap-10 max-w-lg w-full"
          >
            <div className="text-center w-full">
              <p className="text-sm uppercase tracking-widest text-[#FFBA94]/60 mb-3">Step 3 of 3</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-[#FFBA94] tracking-tight">
                {purpose === 'gift' ? "Let's create an awesome gift" : "Let's get to know you"}
              </h1>
              <p className="text-[#FFBA94]/50 mt-4 text-lg">What&rsquo;s your name?</p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => captureFunnelEvent(FunnelEvents.onboarding_field_focused, {
                  field_name: 'name',
                  step: 3,
                  step_number: 3, // Add step_number for PostHog queries
                  context: 'experience_quiz',
                  device_type: getDeviceType(),
                  owns_lamp: ownsLamp ?? false,
                  purpose: purpose ?? 'self',
                })}
                placeholder="What's your name?"
                className="w-full px-4 py-3 rounded-xl bg-[#FFBA94]/10 border border-[#FFBA94]/20 text-[#FFBA94] placeholder:text-[#FFBA94]/60 focus:outline-none focus:ring-2 focus:ring-[#FFBA94]/40 focus:border-transparent"
                autoComplete="name"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStep3}
                className="w-full py-3.5 rounded-xl bg-[#FFBA94] hover:bg-[#FFBA94]/90 text-[#390000] font-semibold transition-colors"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
