'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Sparkles, User, Gift, ArrowLeft } from 'lucide-react'

export interface QuizAnswers {
  ownsLamp: boolean
  purpose: 'self' | 'gift'
}

interface IntroQuizProps {
  onComplete: (answers: QuizAnswers) => void
}

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
}

export function IntroQuiz({ onComplete }: IntroQuizProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [ownsLamp, setOwnsLamp] = useState<boolean | null>(null)

  const handleStep1 = (owns: boolean) => {
    setOwnsLamp(owns)
    setStep(2)
  }

  const handleStep2 = (purpose: 'self' | 'gift') => {
    onComplete({ ownsLamp: ownsLamp!, purpose })
  }

  return (
    <div className="relative flex h-full items-center justify-center bg-neutral-950 px-4">
      {/* Back button for step 2 */}
      {step === 2 && (
        <button
          onClick={() => setStep(1)}
          className="absolute top-6 left-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
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
              <p className="text-sm uppercase tracking-widest text-white/40 mb-3">Step 1 of 2</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Let&rsquo;s get started
              </h1>
              <p className="text-white/50 mt-2 text-lg">Do you already have a Street Lamp?</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep1(true)}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-white/10 border border-white/20 text-white transition-colors cursor-pointer"
              >
                <Lightbulb className="w-8 h-8" />
                <span className="text-sm font-medium">Yes, I do</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep1(false)}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-white/10 border border-white/20 text-white transition-colors cursor-pointer"
              >
                <Sparkles className="w-8 h-8" />
                <span className="text-sm font-medium">I&rsquo;m new here</span>
              </motion.button>
            </div>

            <button
              onClick={() => onComplete({ ownsLamp: false, purpose: 'self' })}
              className="text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              Skip for now
            </button>
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
              <p className="text-sm uppercase tracking-widest text-white/40 mb-3">Step 2 of 2</p>
              <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                Who is this for?
              </h1>
              <p className="text-white/50 mt-2 text-lg">Help us personalize your experience</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep2('self')}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-white/10 border border-white/20 text-white transition-colors cursor-pointer"
              >
                <User className="w-8 h-8" />
                <span className="text-sm font-medium">For me</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStep2('gift')}
                className="flex flex-col items-center justify-center gap-3 aspect-square rounded-2xl bg-white/10 border border-white/20 text-white transition-colors cursor-pointer"
              >
                <Gift className="w-8 h-8" />
                <span className="text-sm font-medium">It&rsquo;s a gift</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
