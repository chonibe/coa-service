'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/storefront-client'
import { cn } from '@/lib/utils'

interface ArtworkInfoProps {
  product: ShopifyProduct
  lampSide1?: ShopifyProduct | null
  lampSide2?: ShopifyProduct | null
  onViewDetail?: () => void
}

export function ArtworkInfo({ product, lampSide1, lampSide2, onViewDetail }: ArtworkInfoProps) {
  const price = product.priceRange?.minVariantPrice?.amount
    ? `$${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`
    : ''
  const artist = product.vendor || ''
  const isSoldOut = !product.availableForSale

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={product.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        role={onViewDetail ? 'button' : undefined}
        tabIndex={onViewDetail ? 0 : undefined}
        onClick={onViewDetail}
        onKeyDown={onViewDetail ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail() } } : undefined}
        className={cn(
          'flex items-start gap-3 group',
          onViewDetail && 'cursor-pointer'
        )}
      >
        <div className="flex-1 space-y-0.5 min-w-0">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-[#f0e8e8] tracking-tight leading-tight truncate">
            {product.title}
          </h2>
          {artist && (
            <p className="text-sm text-neutral-500 dark:text-[#c4a0a0]">by {artist}</p>
          )}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-base font-medium text-neutral-900 dark:text-[#f0e8e8]">{price}</span>
            {isSoldOut && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                Sold Out
              </span>
            )}
          </div>
          {(lampSide1 || lampSide2) && (
            <p className="text-xs text-neutral-500 dark:text-[#c4a0a0] mt-1.5">
              On lamp:{' '}
              {lampSide1 && <>Side A • {lampSide1.title}</>}
              {lampSide1 && lampSide2 && lampSide2.id !== lampSide1.id && ', '}
              {lampSide2 && lampSide2.id !== lampSide1?.id && (
                <>Side B • {lampSide2.title}</>
              )}
            </p>
          )}
        </div>
        {onViewDetail && (
          <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-[#b89090] group-hover:text-neutral-500 dark:group-hover:text-[#d4b8b8] transition-colors mt-1 flex-shrink-0" />
        )}
      </motion.div>
    </AnimatePresence>
  )
}
