'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'
import { EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS } from '@/lib/shop/experience-journey-next-action'

interface TrustChip {
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface LampGridCardProps {
  lamp: ShopifyProduct
  lampPrice: number
  onAddLamp: () => void
  onViewDetail: () => void
  className?: string
  trustChips?: TrustChip[]
  /** Pulse + shine on the primary “Start Collecting” control (journey: add lamp) */
  highlightPrimary?: boolean
}

export function LampGridCard({ onAddLamp, className, highlightPrimary }: LampGridCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e1919] via-[#1a1616] to-[#161212]',
        className
      )}
    >
      {/* CTA */}
      <div className="px-4 pt-4 pb-4 flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={onAddLamp}
          style={{ touchAction: 'manipulation' }}
          className={cn(
            'relative flex items-center justify-center w-11 h-11 rounded-full bg-[#FFBA94] hover:bg-[#ffcaaa] active:scale-[0.98] text-[#1a0e08] transition-all shadow-md shadow-[#FFBA94]/10',
            highlightPrimary && EXPERIENCE_JOURNEY_CTA_HIGHLIGHT_CLASS
          )}
          aria-label="Start collecting"
        >
          <Plus className="w-5 h-5 shrink-0" />
        </button>
        <p className="text-sm font-semibold text-[#FFBA94] leading-none">Start Collecting</p>
      </div>
    </motion.div>
  )
}
