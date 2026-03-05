'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Menu, Info } from 'lucide-react'
import { ExperienceCartChip } from './ExperienceCartChip'
import { ShopSlideoutMenu } from '@/components/shop/navigation/ShopSlideoutMenu'
import { useExperienceOrder } from './ExperienceOrderContext'
import { useExperienceTheme } from './ExperienceThemeContext'
import { cn } from '@/lib/utils'

export function ExperienceSlideoutMenu() {
  const [open, setOpen] = useState(false)
  const { orderBarProps, total, promoCode, promoDiscount, setPromoCode, setPromoDiscount } = useExperienceOrder()
  const [shouldPulse, setShouldPulse] = useState(false)
  const prevLampQuantity = useRef(0)
  const { theme } = useExperienceTheme()

  const showLampCard = orderBarProps && typeof orderBarProps.lampPrice === 'number'
  const lamp = orderBarProps?.lamp
  const lampQuantity = orderBarProps?.lampQuantity ?? 0
  const pastLampPaywall = orderBarProps?.pastLampPaywall ?? false

  useEffect(() => {
    if (lampQuantity > prevLampQuantity.current && lampQuantity > 0) {
      setShouldPulse(true)
    }
    prevLampQuantity.current = lampQuantity
  }, [lampQuantity])
  const handleLampQuantityChange = orderBarProps?.onLampQuantityChange ?? (() => {})
  const setDetailProduct = orderBarProps?.onViewLampDetail

  return (
    <>
      <header
        className={cn(
          'shrink-0 flex items-center h-14 sm:h-16 px-4 sm:px-6',
          'bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-white/10 safe-area-inset-top'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 -m-2 text-neutral-600 hover:text-neutral-900 dark:text-white/80 dark:hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <Menu size={24} className="shrink-0" />
        </button>

        {/* Left spacer — on mobile: centers lamp; on desktop: pushes lamp+cart right */}
        {showLampCard && lamp && <div className="flex-1 min-w-0" />}

        {/* Lamp + counter — centered on mobile, right side on desktop (only after paywall) */}
        {showLampCard && lamp && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-0.5 flex-shrink-0 min-w-0">
              {pastLampPaywall && (
                <div className="flex items-center gap-0.5" data-wizard-lamp-controls>
                  <button type="button" onClick={() => handleLampQuantityChange(Math.max(0, lampQuantity - 1))} className="w-5 h-5 flex items-center justify-center rounded text-[12px] font-medium bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 dark:bg-white/10 dark:border-0 dark:hover:bg-white/20 dark:text-white transition-colors" aria-label="Decrease quantity">−</button>
                  <button type="button" onClick={() => handleLampQuantityChange(lampQuantity + 1)} className="w-5 h-5 flex items-center justify-center rounded text-[12px] font-medium bg-white border border-neutral-200 text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300 dark:bg-white/10 dark:border-0 dark:hover:bg-white/20 dark:text-white transition-colors" aria-label="Increase quantity">+</button>
                  <button
                    type="button"
                    onClick={() => setDetailProduct?.(lamp)}
                    className="w-5 h-5 flex items-center justify-center rounded text-[#047AFF] hover:text-[#0366d6] dark:text-white/70 dark:hover:text-white transition-colors"
                    aria-label="View lamp details"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <motion.button
                type="button"
                onClick={() => setDetailProduct?.(lamp)}
                className={cn(
                  'flex items-center gap-2 min-w-0 transition-colors cursor-pointer text-left relative',
                  lampQuantity > 0
                    ? 'text-neutral-800 dark:text-white hover:opacity-90'
                    : 'text-neutral-600 dark:text-white/80 dark:hover:text-white'
                )}
                aria-label={`${lampQuantity} Street ${lampQuantity > 1 ? 'Lamps' : 'Lamp'}`}
                animate={
                  shouldPulse
                    ? {
                        scale: [1, 1.35, 1],
                        filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'],
                      }
                    : { scale: 1 }
                }
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onAnimationComplete={() => setShouldPulse(false)}
              >
                <span className="relative inline-flex">
                  <span className={cn('absolute inset-0 flex items-center justify-center translate-x-0.5 text-[11px] font-bold tabular-nums pointer-events-none', lampQuantity > 0 ? 'text-[#047AFF] dark:text-[#60A5FA]' : 'text-neutral-500 dark:text-[#ffffff]')}>
                    {lampQuantity}
                  </span>
                  <svg viewBox="0 0 306 400" fill="currentColor" className={cn('w-6 h-7 shrink-0', lampQuantity > 0 ? 'text-neutral-400 dark:text-neutral-300' : 'text-neutral-400 dark:text-white/60')} xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </span>
                <span className={cn('text-xs font-medium truncate', lampQuantity > 0 ? 'text-neutral-800 dark:text-white' : 'text-neutral-600 dark:text-white/80')}>Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Right spacer — mobile only: centers lamp between menu and cart */}
        {showLampCard && lamp && <div className="flex-1 min-w-0 md:hidden" />}

        <div className={cn('flex items-center self-center shrink-0', showLampCard && lamp && 'md:ml-8')}>
          <ExperienceCartChip variant="light" className={cn(showLampCard && lamp ? '' : 'ml-auto')} />
        </div>
      </header>

      <ShopSlideoutMenu
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        authRedirectTo="/shop/experience"
        promoCode={promoCode}
        promoDiscount={promoDiscount}
        onPromoChange={(code, discount) => { setPromoCode(code); setPromoDiscount(discount) }}
        orderTotal={total}
        volumeDiscountLabel={orderBarProps?.lampSavings != null && orderBarProps.lampSavings > 0 ? 'Volume Discount Applied' : undefined}
        volumeDiscountDescription={orderBarProps?.lampSavings != null && orderBarProps.lampSavings > 0 ? 'Discount varies by size & material' : undefined}
      />
    </>
  )
}
