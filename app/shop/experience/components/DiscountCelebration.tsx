'use client'

import { motion } from 'framer-motion'

export interface DiscountCelebrationProps {
  amount: number
  onComplete: () => void
  /** When true, pops from under the cart icon (anchored bottom-right) */
  popFromCart?: boolean
}

export function DiscountCelebration({ amount, onComplete, popFromCart = false }: DiscountCelebrationProps) {
  const formatted = amount >= 0.01 ? `$${amount.toFixed(2)}` : ''

  if (popFromCart) {
    return (
      <div className="absolute right-0 bottom-0 translate-y-full pt-1 z-[70] pointer-events-none flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.96 }}
          animate={{
            opacity: [0, 1, 0.92, 0],
            y: [4, -2, -8, -18],
            scale: [0.96, 1, 1, 1],
          }}
          transition={{
            duration: 1,
            ease: [0.25, 1, 0.5, 1],
          }}
          onAnimationComplete={onComplete}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border border-green-200/60 dark:border-green-700/50"
        >
          <span className="tabular-nums">-{formatted}</span>
          <span className="text-green-600 dark:text-green-500">lamp</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="absolute left-0 right-0 top-0 z-[20] pointer-events-none px-4 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: [0, 0.95, 0.88, 0],
          y: [12, 0, -4, -16],
        }}
        transition={{
          duration: 1,
          ease: 'easeOut',
        }}
        onAnimationComplete={onComplete}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border border-green-200/60 dark:border-green-700/50"
      >
        <span className="tabular-nums">-{formatted}</span>
        <span className="text-green-600 dark:text-green-500">lamp</span>
      </motion.div>
    </div>
  )
}
