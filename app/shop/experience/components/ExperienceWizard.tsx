'use client'

import { useState, useEffect, useCallback, useLayoutEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Lamp, ImageIcon, CreditCard, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const WIZARD_STORAGE_KEY = 'sc-experience-wizard-complete'

export type WizardStepId =
  | 'spline-preview'
  | 'selector-add-eye'
  | 'lamp-controls'
  | 'order-bar'

interface WizardStep {
  id: WizardStepId
  target: string
  title: string
  description: string
  icon: React.ReactNode
}

/** Steps shown when user is AT paywall (lamp not yet added) */
const WIZARD_STEPS_AT_PAYWALL: WizardStep[] = [
  {
    id: 'spline-preview',
    target: 'data-wizard-spline',
    title: 'Drag and rotate',
    description: 'Drag the model to spin it 360° and explore your lamp from every angle.',
    icon: <RotateCw className="w-5 h-5" />,
  },
]

/** Steps shown when user has PASSED paywall (lamp added or skipped) */
const WIZARD_STEPS_PAST_PAYWALL: WizardStep[] = [
  {
    id: 'spline-preview',
    target: 'data-wizard-spline',
    title: 'Drag and rotate',
    description: 'Drag the model to spin it 360° and explore your lamp from every angle.',
    icon: <RotateCw className="w-5 h-5" />,
  },
  {
    id: 'selector-add-eye',
    target: 'data-wizard-first-card',
    title: 'Add, Preview & Info',
    description: 'Tap Add to add to order, Eye to preview on the lamp, and Info for full artwork details.',
    icon: <ImageIcon className="w-5 h-5" />,
  },
  {
    id: 'lamp-controls',
    target: 'data-wizard-lamp-controls',
    title: 'Street Lamp',
    description: 'Add or remove lamps from your order using the + and − buttons here.',
    icon: <Lamp className="w-5 h-5" />,
  },
  {
    id: 'order-bar',
    target: 'data-wizard-order-bar',
    title: 'Checkout',
    description: 'Review your order here and tap checkout when you\'re ready to complete your purchase.',
    icon: <CreditCard className="w-5 h-5" />,
  },
]

function getVisibleElement(selector: string): Element | null {
  const candidates = document.querySelectorAll(selector)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    if (rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden') {
      return el
    }
  }
  return candidates[0] ?? null
}

function useElementRect(selector: string, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  const update = useCallback(() => {
    if (!active) return
    const el = getVisibleElement(selector)
    if (el) {
      setRect(el.getBoundingClientRect())
    } else {
      setRect(null)
    }
  }, [selector, active])

  useLayoutEffect(() => {
    update()
    if (!active) return
    const resize = new ResizeObserver(update)
    const el = getVisibleElement(selector)
    if (el) resize.observe(el)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      resize.disconnect()
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [selector, active, update])

  return rect
}

interface ExperienceWizardProps {
  onComplete?: () => void
  /** When true, user has added lamp or skipped paywall — show full steps including selector and lamp controls */
  pastLampPaywall?: boolean
}

export function ExperienceWizard({ onComplete, pastLampPaywall = false }: ExperienceWizardProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  const wizardSteps = useMemo(
    () => (pastLampPaywall ? WIZARD_STEPS_PAST_PAYWALL : WIZARD_STEPS_AT_PAYWALL),
    [pastLampPaywall]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const completed = localStorage.getItem(WIZARD_STORAGE_KEY) === 'true'
    if (!completed) {
      setMounted(true)
      const t = setTimeout(() => setIsActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  // Reset step index when switching from at-paywall to past-paywall (e.g. user adds lamp)
  useEffect(() => {
    if (pastLampPaywall && stepIndex >= wizardSteps.length) {
      setStepIndex(Math.min(stepIndex, wizardSteps.length - 1))
    }
  }, [pastLampPaywall, wizardSteps.length, stepIndex])

  const step = wizardSteps[stepIndex]
  const selector = step ? `[${step.target}]` : ''
  const rect = useElementRect(selector, isActive && !!step)

  const handleNext = useCallback(() => {
    if (stepIndex >= wizardSteps.length - 1) {
      localStorage.setItem(WIZARD_STORAGE_KEY, 'true')
      setIsActive(false)
      onComplete?.()
    } else {
      setStepIndex((i) => i + 1)
    }
  }, [stepIndex, onComplete, wizardSteps.length])

  const handleBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }, [stepIndex])

  const handleSkip = useCallback(() => {
    localStorage.setItem(WIZARD_STORAGE_KEY, 'true')
    setIsActive(false)
    onComplete?.()
  }, [onComplete])

  if (!mounted || !isActive || !step) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] pointer-events-none">
        {/* Spotlight overlay: 4 rectangles around target */}
        {rect && (
          <div className="absolute inset-0 pointer-events-auto" aria-hidden="true">
            {/* Top */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 right-0 top-0 bg-black/60"
              style={{ height: rect.top }}
              onClick={handleNext}
            />
            {/* Left */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 bottom-0 left-0 bg-black/60"
              style={{ width: rect.left, top: rect.top, height: rect.height }}
              onClick={handleNext}
            />
            {/* Right */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 bottom-0 right-0 bg-black/60"
              style={{
                width: window.innerWidth - rect.right,
                left: rect.right,
                top: rect.top,
                height: rect.height,
              }}
              onClick={handleNext}
            />
            {/* Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 right-0 bottom-0 bg-black/60"
              style={{ height: window.innerHeight - rect.bottom }}
              onClick={handleNext}
            />
            {/* Highlight ring around target */}
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute rounded-lg ring-4 ring-amber-400 ring-offset-2 ring-offset-transparent shadow-[0_0_0_2px_rgba(251,191,36,0.5)]"
              style={{
                left: rect.left - 8,
                top: rect.top - 8,
                width: rect.width + 16,
                height: rect.height + 16,
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* Tooltip card */}
        <div className="absolute inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 bottom-6 md:bottom-8 max-w-md pointer-events-auto z-10">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden"
          >
            <div className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                {step.id === 'spline-preview' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    <Lamp className="w-5 h-5" />
                  </motion.div>
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900">{step.title}</p>
                <p className="text-sm text-neutral-600 mt-0.5">{step.description}</p>
              </div>
              <button
                onClick={handleSkip}
                className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 flex items-center justify-center transition-colors"
                aria-label="Back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex items-center gap-2">
                {wizardSteps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      i === stepIndex ? 'bg-amber-500' : 'bg-neutral-200'
                    )}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  disabled={stepIndex === 0}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    stepIndex === 0
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  <ChevronLeft className="w-4 h-4 inline" />
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  {stepIndex >= wizardSteps.length - 1 ? 'Done' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
          <p className="text-center text-xs text-neutral-500 mt-2">Step {stepIndex + 1} of {wizardSteps.length}</p>
        </div>
      </div>
    </AnimatePresence>
  )
}
