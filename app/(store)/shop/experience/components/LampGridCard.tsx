'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Info, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'

interface LampGridCardProps {
  lamp: ShopifyProduct
  lampPrice: number
  onAddLamp: () => void
  onViewDetail: () => void
  className?: string
}

export function LampGridCard({ lamp, lampPrice, onAddLamp, onViewDetail, className }: LampGridCardProps) {
  const imageUrl = lamp.featuredImage?.url ?? lamp.images?.edges?.[0]?.node?.url

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'col-span-2 relative rounded-2xl overflow-hidden border border-[#3a3030] bg-gradient-to-br from-[#1e1919] via-[#1a1616] to-[#161212]',
        className
      )}
    >
      {/* Info button — top right corner */}
      <button
        type="button"
        onClick={onViewDetail}
        className="absolute top-3 right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full text-[#a08080] hover:text-[#e8d4d4] hover:bg-white/5 transition-colors"
        aria-label="View lamp details"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {/* Card body */}
      <div className="flex items-center gap-4 px-4 pt-4 pb-3">
        {/* Lamp thumbnail */}
        <div className="shrink-0 relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-[#252020] ring-1 ring-white/5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={lamp.title}
              fill
              className="object-cover scale-110"
              sizes="72px"
              priority
            />
          ) : (
            <svg viewBox="0 0 306 400" fill="currentColor" className="absolute inset-0 m-auto w-6 h-7 text-[#d4b8b8]" xmlns="http://www.w3.org/2000/svg">
              <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 pr-6">
          <span className="text-sm font-semibold text-[#FFBA94] leading-tight tracking-tight">
            Start with the Street Lamp
          </span>
          <p className="text-[11px] text-[#9a8080] leading-snug">
            Choose your lamp first, then personalize it with your favorite art.
          </p>
        </div>
      </div>


      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onAddLamp}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FFBA94] hover:bg-[#ffcaaa] active:scale-[0.98] text-[#1a0e08] text-sm font-bold transition-all shadow-md shadow-[#FFBA94]/10"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Add your Street Lamp — ${lampPrice.toFixed(2)}
        </button>
      </div>
    </motion.div>
  )
}
