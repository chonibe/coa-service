'use client'

import { motion } from 'framer-motion'

export interface DiscountCelebrationProps {
  amount: number
  onComplete: () => void
  /** When true, pops from under the cart icon (anchored bottom-right) */
  popFromCart?: boolean
}

/** Total animation duration (ms) — message holds at full visibility for most of it, then fades */
const TOTAL_DURATION_MS = 2800
const TOTAL_DURATION_S = TOTAL_DURATION_MS / 1000

const pillClass =
  'inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-bold tabular-nums bg-white/95 dark:bg-neutral-800/95 text-neutral-800 dark:text-neutral-100 shadow-xl border border-neutral-200/80 dark:border-neutral-600/60 backdrop-blur-sm'

export function DiscountCelebration({ amount, onComplete, popFromCart = false }: DiscountCelebrationProps) {
  const formatted = amount >= 0.01 ? `$${amount.toFixed(2)}` : ''

  // Timeline: quick pop in, long hold at full visibility, then fade out and float
  const holdEnd = (TOTAL_DURATION_MS - 500) / 1000
  const opacityKeyframes = [0, 1, 1, 0]
  const yKeyframesPop = [8, -4, -4, -24]
  const scaleKeyframes = [0.7, 1.08, 1, 1]
  const keyframeTimes = [0, 0.12, holdEnd / TOTAL_DURATION_S, 1] as const

  if (popFromCart) {
    return (
      <div className="absolute right-0 bottom-0 translate-y-full pt-1 z-[70] pointer-events-none flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.7 }}
          animate={{
            opacity: opacityKeyframes,
            y: yKeyframesPop,
            scale: scaleKeyframes,
          }}
          transition={{
            duration: TOTAL_DURATION_S,
            ease: [0.22, 1, 0.36, 1],
            times: keyframeTimes,
          }}
          onAnimationComplete={onComplete}
          className={pillClass}
        >
          <span className="text-emerald-600 dark:text-emerald-400">-{formatted}</span>
          <span className="text-neutral-500 dark:text-neutral-400 font-medium">saved</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="absolute left-0 right-0 top-0 z-[20] pointer-events-none px-4 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.7 }}
        animate={{
          opacity: opacityKeyframes,
          y: [16, 0, 0, -20],
          scale: scaleKeyframes,
        }}
        transition={{
          duration: TOTAL_DURATION_S,
          ease: [0.22, 1, 0.36, 1],
          times: keyframeTimes,
        }}
        onAnimationComplete={onComplete}
        className={pillClass}
      >
        <span className="text-emerald-600 dark:text-emerald-400">-{formatted}</span>
        <span className="text-neutral-500 dark:text-neutral-400 font-medium">saved</span>
      </motion.div>
    </div>
  )
}
