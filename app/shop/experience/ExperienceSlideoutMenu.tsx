'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, Info, Minus, Plus } from 'lucide-react'
import { ExperienceCartChip } from './ExperienceCartChip'
import { DiscountCelebration } from './components/DiscountCelebration'
import { ShopSlideoutMenu } from '@/components/shop/navigation/ShopSlideoutMenu'
import { useExperienceOrder } from './ExperienceOrderContext'
import { useExperienceTheme } from './ExperienceThemeContext'
import { cn } from '@/lib/utils'

export function ExperienceSlideoutMenu() {
  const [open, setOpen] = useState(false)
  const { orderBarProps, total, promoCode, promoDiscount, setPromoCode, setPromoDiscount, discountCelebrationAmount, setDiscountCelebrationAmount } = useExperienceOrder()
  const [shouldPulse, setShouldPulse] = useState(false)
  const prevLampQuantity = useRef(0)
  const { theme } = useExperienceTheme()

  const showLampCard = orderBarProps && typeof orderBarProps.lampPrice === 'number'
  const lamp = orderBarProps?.lamp
  const lampQuantity = orderBarProps?.lampQuantity ?? 0
  const pastLampPaywall = orderBarProps?.pastLampPaywall ?? false
  const wizardHighlightStep = orderBarProps?.wizardHighlightStep ?? -1
  const wizardHighlightActive = orderBarProps?.wizardHighlightActive ?? false
  const highlightLampIcon = wizardHighlightActive && wizardHighlightStep === 3

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
          'bg-white dark:bg-[#171515] border-b border-neutral-200 dark:border-white/10 safe-area-inset-top'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="inline-flex items-center justify-center p-2 -m-2 text-neutral-600 hover:text-neutral-900 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8] transition-colors cursor-pointer shrink-0"
        >
          <Menu size={24} className="shrink-0" />
        </button>

        {/* Left spacer — pushes lamp+cart right (or just cart when lamp in Configurator) */}
        {showLampCard && lamp && <div className="flex-1 min-w-0" />}

        {/* Lamp + counter — below lg (mobile/tablet); at lg+ it lives in selector bar (Configurator) */}
        {showLampCard && lamp && (
          <div className="lg:hidden flex items-center shrink-0">
            <div className={cn(
              'flex items-center gap-1 flex-shrink-0 min-w-0 rounded-md px-2 py-0 bg-neutral-100 dark:bg-[#262222]/70',
              highlightLampIcon && 'ring-2 ring-inset ring-amber-600/70'
            )}>
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => setDetailProduct?.(lamp)}
                onKeyDown={(e) => e.key === 'Enter' && setDetailProduct?.(lamp)}
                className={cn(
                  'flex items-center gap-1 min-w-0 transition-colors cursor-pointer text-left relative py-0',
                  lampQuantity > 0
                    ? 'text-neutral-800 dark:text-[#f0e8e8] hover:opacity-90'
                    : 'text-neutral-600 dark:text-[#f0e8e8]/80 dark:hover:text-[#f0e8e8]'
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
                  <span className={cn('absolute inset-0 flex items-center justify-center translate-x-0.5 text-[10px] font-bold tabular-nums pointer-events-none', lampQuantity > 0 ? 'text-[#047AFF] dark:text-[#60A5FA]' : 'text-neutral-500 dark:text-[#f0e8e8]')}>
                    {lampQuantity}
                  </span>
                  <svg viewBox="0 0 306 400" fill="currentColor" className={cn('w-5 h-6 shrink-0', lampQuantity > 0 ? 'text-neutral-400 dark:text-[#d4b8b8]' : 'text-neutral-400 dark:text-[#f0e8e8]/60')} xmlns="http://www.w3.org/2000/svg">
                    <path d="M174.75 0C176.683 0 178.25 1.567 178.25 3.5V5.5H243C277.794 5.5 306 33.7061 306 68.5V336.5C306 371.294 277.794 399.5 243 399.5H63C28.2061 399.5 0 371.294 0 336.5V68.5C0 33.7061 28.2061 5.5 63 5.5H152.25V3.5C152.25 1.567 153.817 0 155.75 0H174.75ZM44.6729 362.273C42.0193 359.894 37.9386 360.115 35.5586 362.769C33.1786 365.422 33.4002 369.503 36.0537 371.883L41.5078 376.774C44.1614 379.154 48.2421 378.933 50.6221 376.279C53.002 373.626 52.7795 369.545 50.126 367.165L44.6729 362.273ZM111 28.5C88.3563 28.5 70 46.8563 70 69.5V335.5C70 358.144 88.3563 376.5 111 376.5H243C265.644 376.5 284 358.144 284 335.5V69.5C284 46.8563 265.644 28.5 243 28.5H111Z" />
                  </svg>
                </span>
                <span className={cn('text-[10px] font-medium truncate', lampQuantity > 0 ? 'text-neutral-800 dark:text-[#f0e8e8]' : 'text-neutral-600 dark:text-[#f0e8e8]/80')}>Street {lampQuantity > 1 ? 'Lamps' : 'Lamp'}</span>
              </motion.div>
              {pastLampPaywall && (
                <div className="flex items-center gap-0.5 ml-0.5 shrink-0" data-wizard-lamp-controls>
                  {lampQuantity > 0 && (
                    <button
                      type="button"
                      onClick={() => handleLampQuantityChange(Math.max(0, lampQuantity - 1))}
                      className="h-5 w-5 flex items-center justify-center p-0 text-[#047AFF] dark:text-[#60A5FA] hover:opacity-80 transition-opacity"
                      aria-label="Decrease lamp quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLampQuantityChange(lampQuantity + 1)}
                    className={cn(
                      'flex items-center justify-center transition-colors shrink-0',
                      lampQuantity > 0
                        ? 'h-5 w-5 p-0 text-[#047AFF] dark:text-[#60A5FA]'
                        : 'h-5 px-2 rounded-md border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#201c1c] text-neutral-700 dark:text-[#e8d4d4] hover:border-neutral-300 dark:hover:border-[#3e3838] hover:bg-neutral-100 dark:hover:bg-[#262222] text-[10px] font-medium'
                    )}
                    aria-label={lampQuantity > 0 ? 'Add another lamp' : 'Add lamp'}
                  >
                    {lampQuantity > 0 ? (
                      <Plus className="w-3.5 h-3.5" />
                    ) : (
                      <span>Add</span>
                    )}
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDetailProduct?.(lamp)}
              className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-700 dark:text-[#c4a0a0] dark:hover:text-[#f0e8e8] transition-colors shrink-0 -mr-0.5"
              aria-label="View lamp details"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Right spacer — when lamp in header: centers lamp between menu and cart */}
        {showLampCard && lamp && <div className="flex-1 min-w-0 lg:hidden" />}

        <div className={cn('relative flex items-center self-center shrink-0', showLampCard && lamp && 'md:ml-8')}>
          <ExperienceCartChip variant="light" className={cn(showLampCard && lamp ? '' : 'ml-auto')} />
          <AnimatePresence>
            {discountCelebrationAmount !== null && (
              <DiscountCelebration
                key="discount-celebration"
                amount={discountCelebrationAmount}
                onComplete={() => setDiscountCelebrationAmount(null)}
                popFromCart
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      <ShopSlideoutMenu
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        authRedirectTo="/experience"
        logoHref="/shop/street-collector"
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
