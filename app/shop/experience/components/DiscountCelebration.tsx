'use client'

import { motion } from 'framer-motion'

/** Lamp icon — street lamp SVG */
function LampIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 306 400" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
    </svg>
  )
}

export function DiscountCelebration({
  amount,
  onComplete,
}: {
  amount: number
  onComplete: () => void
}) {
  const formatted = amount >= 0.01 ? `$${amount.toFixed(2)}` : ''

  return (
    <div className="absolute left-0 right-0 top-0 z-[20] pointer-events-none px-4 pt-2">
      {/* Slide-up notification at top of selector, next to Artworks icon */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: [0, 0.95, 0.9, 0],
          y: [16, 0, -6, -20],
        }}
        transition={{
          duration: 1.2,
          ease: 'easeOut',
        }}
        onAnimationComplete={onComplete}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg shadow-md"
      >
        <LampIcon className="w-4 h-5 text-white shrink-0" />
        <span>-{formatted} off lamp</span>
      </motion.div>
    </div>
  )
}
