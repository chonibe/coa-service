'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Menu, Check, ChevronRight } from 'lucide-react'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { ExperienceCartChip } from './ExperienceCartChip'

const ROUND_LOGO_URL = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'
import { ShopSlideoutMenu } from '@/components/shop/navigation/ShopSlideoutMenu'

const DiscountCelebration = dynamic(
  () => import('./components/DiscountCelebration').then((m) => ({ default: m.DiscountCelebration })),
  { ssr: false }
)
import { useExperienceOrder } from './ExperienceOrderContext'
import { useExperienceTheme } from './ExperienceThemeContext'
import { useExperienceAuthContext } from './ExperienceAuthContext'
import { cn } from '@/lib/utils'

const ONBOARDING_PATH_PREFIX = '/shop/experience-v2/onboarding'

export function ExperienceSlideoutMenu() {
  const pathname = usePathname()
  const isOnOnboarding = pathname?.startsWith(ONBOARDING_PATH_PREFIX) ?? false
  const { menuOpen: open, setMenuOpen: setOpen, openAuthWhenMenuOpens, setOpenAuthWhenMenuOpens, onboardingRedirectPath } = useExperienceAuthContext()
  const { orderBarProps, total, promoCode, promoDiscount, setPromoCode, setPromoDiscount, discountCelebrationAmount, setDiscountCelebrationAmount, headerCenterContent } = useExperienceOrder()
  const [shouldPulse, setShouldPulse] = useState(false)
  const prevLampQuantity = useRef(0)
  const { theme } = useExperienceTheme()

  const showLampCard = orderBarProps && typeof orderBarProps.lampPrice === 'number'
  const lamp = orderBarProps?.lamp
  const lampQuantity = orderBarProps?.lampQuantity ?? 0
  const pastLampPaywall = orderBarProps?.pastLampPaywall ?? false
  const cartCount = orderBarProps?.selectedArtworks?.length ?? 0

  useEffect(() => {
    if (lampQuantity > prevLampQuantity.current && lampQuantity > 0) {
      setShouldPulse(true)
    }
    prevLampQuantity.current = lampQuantity
  }, [lampQuantity])

  return (
    <>
      <header
        className={cn(
          'shrink-0 relative flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6',
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

        {/* Logo: absolute center of top bar, same vertical alignment as hamburger/cart */}
        <div className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center pointer-events-none">
          <Link
            href="/"
            aria-label="Street Collector - Home"
            className="pointer-events-auto inline-flex items-center justify-center p-2 -m-2 transition-opacity hover:opacity-80 z-10"
          >
          <img
            src={getProxiedImageUrl(ROUND_LOGO_URL)}
            alt="Street Collector"
            width={32}
            height={32}
            className="w-8 h-8 object-contain shrink-0"
          />
          </Link>
        </div>

        {/* Right: headerCenterContent on desktop, cart */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center">
            {headerCenterContent}
          </div>
          {!isOnOnboarding && (
            <div className={cn('relative flex items-center self-center shrink-0', showLampCard && lamp && pastLampPaywall ? 'md:ml-8 lg:ml-auto' : 'ml-auto')}>
              <ExperienceCartChip variant="light" />
              {discountCelebrationAmount !== null && (
                <DiscountCelebration
                  amount={discountCelebrationAmount}
                  onComplete={() => setDiscountCelebrationAmount(null)}
                  popFromCart
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Steps — desktop only (hidden) */}
      {false && !isOnOnboarding && orderBarProps && (
          <div className="hidden md:flex items-center gap-2 ml-auto mr-3">
              {/* Step 1 */}
              <div className={cn('flex items-center gap-1.5', lampQuantity === 0 ? 'opacity-100' : 'opacity-60')}>
                <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity === 0 ? 'bg-[#047AFF] text-white' : 'bg-[#047AFF] text-white')}>
                  {lampQuantity > 0 ? <Check className="w-2.5 h-2.5" /> : '1'}
                </span>
                <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity === 0 ? 'text-[#047AFF]' : 'text-neutral-600 dark:text-neutral-400')}>
                  {lampQuantity === 0 ? 'Add Street Lamp' : ''}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
              {/* Step 2 */}
              <div className={cn('flex items-center gap-1.5', lampQuantity > 0 && cartCount === 0 ? 'opacity-100' : lampQuantity > 0 && cartCount > 0 ? 'opacity-60' : 'opacity-40')}>
                <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity > 0 && cartCount === 0 ? 'bg-[#047AFF] text-white' : lampQuantity > 0 && cartCount > 0 ? 'bg-[#047AFF] text-white' : 'bg-neutral-400 dark:bg-neutral-600 text-white')}>
                  {lampQuantity > 0 && cartCount > 0 ? <Check className="w-2.5 h-2.5" /> : '2'}
                </span>
                <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity > 0 && cartCount === 0 ? 'text-[#047AFF]' : lampQuantity > 0 && cartCount > 0 ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-500')}>
                  {lampQuantity === 0 ? 'Add your Art' : cartCount === 0 ? '' : 'Artwork added'}
                </span>
              </div>
              {lampQuantity > 0 && cartCount > 0 && (
                <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
              )}
          </div>
        )}

      <ShopSlideoutMenu
        open={open}
        onClose={() => setOpen(false)}
        theme={theme}
        showThemeToggle
        authRedirectTo={onboardingRedirectPath ?? '/experience'}
        openAuthWhenOpened={openAuthWhenMenuOpens}
        onAuthOpened={() => setOpenAuthWhenMenuOpens(false)}
        logoHref="/"
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
