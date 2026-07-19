'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Check, ChevronRight, LayoutGrid } from 'lucide-react'
import { ExperienceCartChip } from '@/app/(store)/shop/experience-v2/ExperienceCartChip'
import { ShopUnifiedTopBar } from '@/components/shop/navigation/ShopUnifiedTopBar'

const DiscountCelebration = dynamic(
  () => import('./components/DiscountCelebration').then((m) => ({ default: m.DiscountCelebration })),
  { ssr: false }
)
import { useExperienceOrder } from './ExperienceOrderContext'
import { useExperienceTheme } from './ExperienceThemeContext'
import { useExperienceAuthContext } from './ExperienceAuthContext'
import { cn } from '@/lib/utils'
import { shopUnifiedTopBarSpacerHeightClass } from '@/lib/shop/shop-unified-top-bar-layout'

const ONBOARDING_PATH_PREFIX = '/shop/experience-v2/onboarding'
const CANONICAL_EXPERIENCE_PATH = '/shop/experience'
const EXPERIENCE_V3_ALIAS_PREFIX = '/shop/experience-v3'

function isExperienceV3Path(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === CANONICAL_EXPERIENCE_PATH || pathname.startsWith(EXPERIENCE_V3_ALIAS_PREFIX)
}
/** Temporarily hidden — re-enable when shipping promo returns to the header sub-bar. */
const SHOW_SHIPPING_PROMO = false

export function ExperienceSlideoutMenu() {
  const pathname = usePathname()
  const isOnOnboarding = pathname?.startsWith(ONBOARDING_PATH_PREFIX) ?? false
  const isExperienceV3 = isExperienceV3Path(pathname)
  const { menuOpen: open, setMenuOpen: setOpen, openAuthWhenMenuOpens, setOpenAuthWhenMenuOpens, onboardingRedirectPath } = useExperienceAuthContext()
  const {
    orderBarProps,
    total,
    promoCode,
    promoDiscount,
    setPromoCode,
    setPromoDiscount,
    discountCelebrationAmount,
    setDiscountCelebrationAmount,
    headerCenterContent,
    headerTrailingContent,
    openArtworkPicker,
  } = useExperienceOrder()
  const viewLampDetail = orderBarProps?.onViewLampDetail
  const lampForSpecs = orderBarProps?.lamp
  const openLampSpecifications =
    viewLampDetail && lampForSpecs ? () => viewLampDetail(lampForSpecs) : undefined
  const { theme } = useExperienceTheme()

  const showLampCard = orderBarProps && typeof orderBarProps.lampPrice === 'number'
  const lamp = orderBarProps?.lamp
  const lampQuantity = orderBarProps?.lampQuantity ?? 0
  const pastLampPaywall = orderBarProps?.pastLampPaywall ?? false
  const cartCount = orderBarProps?.selectedArtworks?.length ?? 0

  const rightSlot = !isOnOnboarding ? (
    <div
      className={cn(
        'relative flex items-center gap-2 self-center shrink-0',
        showLampCard && lamp && pastLampPaywall ? 'md:ml-8 lg:ml-auto' : 'ml-auto'
      )}
    >
      {lampQuantity > 0 && cartCount === 0 && (
        <span
          className={cn(
            'hidden md:inline-flex max-w-[min(9.5rem,46vw)] items-center truncate rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-tight sm:max-w-none sm:px-2.5 sm:py-1 sm:text-xs',
            'border-violet-300 bg-violet-50 text-violet-800',
            'dark:border-violet-500/50 dark:bg-violet-950/80 dark:text-violet-100'
          )}
          role="status"
          aria-live="polite"
        >
          Lamp added to your collection
        </span>
      )}
      <ExperienceCartChip variant="light" />
      {discountCelebrationAmount !== null && (
        <DiscountCelebration
          amount={discountCelebrationAmount}
          onComplete={() => setDiscountCelebrationAmount(null)}
          popFromCart
        />
      )}
    </div>
  ) : null

  return (
    <>
      <ShopUnifiedTopBar
        position="fixed"
        centerContent={headerCenterContent}
        headerTrailingContent={headerTrailingContent}
        rightSlot={rightSlot}
        hideRight={isOnOnboarding}
        menuTheme={theme}
        menuOpen={open}
        onMenuOpenChange={setOpen}
        menuProps={{
          showThemeToggle: true,
          authRedirectTo: onboardingRedirectPath ?? '/experience',
          openAuthWhenOpened: openAuthWhenMenuOpens,
          onAuthOpened: () => setOpenAuthWhenMenuOpens(false),
          logoHref: '/',
          promoCode,
          promoDiscount,
          onPromoChange: (code, discount) => {
            setPromoCode(code)
            setPromoDiscount(discount)
          },
          orderTotal: total,
          volumeDiscountLabel:
            orderBarProps?.lampSavings != null && orderBarProps.lampSavings > 0
              ? 'Volume Discount Applied'
              : undefined,
          volumeDiscountDescription:
            orderBarProps?.lampSavings != null && orderBarProps.lampSavings > 0
              ? 'Discount varies by size & material'
              : undefined,
          onSpecifications: openLampSpecifications,
          onChooseYourArt: isOnOnboarding ? undefined : openArtworkPicker,
          chooseYourArtLabel: isExperienceV3 ? 'The Collection' : undefined,
          chooseYourArtIcon: isExperienceV3 ? LayoutGrid : undefined,
        }}
      />
      <div className={cn(shopUnifiedTopBarSpacerHeightClass, 'shrink-0')} aria-hidden />

      {!isOnOnboarding && SHOW_SHIPPING_PROMO && (
        <div
          className="shrink-0 border-b border-neutral-200/80 px-4 py-1 text-center text-[10px] text-neutral-500 dark:border-white/5 dark:text-[#a09090] sm:text-[11px]"
          role="status"
        >
          Free worldwide shipping · 9–15 business days
        </div>
      )}

      {/* Steps — desktop only (hidden) */}
      {false && !isOnOnboarding && orderBarProps && (
          <div className="hidden md:flex items-center gap-2 ml-auto mr-3">
              {/* Step 1 */}
              <div className={cn('flex items-center gap-1.5', lampQuantity === 0 ? 'opacity-100' : 'opacity-60')}>
                <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity === 0 ? 'bg-experience-highlight text-white' : 'bg-experience-highlight text-white')}>
                  {lampQuantity > 0 ? <Check className="w-2.5 h-2.5" /> : '1'}
                </span>
                <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity === 0 ? 'text-experience-highlight' : 'text-neutral-600 dark:text-neutral-400')}>
                  {lampQuantity === 0 ? 'Add Street Lamp' : ''}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
              {/* Step 2 */}
              <div className={cn('flex items-center gap-1.5', lampQuantity > 0 && cartCount === 0 ? 'opacity-100' : lampQuantity > 0 && cartCount > 0 ? 'opacity-60' : 'opacity-40')}>
                <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold shrink-0', lampQuantity > 0 && cartCount === 0 ? 'bg-experience-highlight text-white' : lampQuantity > 0 && cartCount > 0 ? 'bg-experience-highlight text-white' : 'bg-neutral-400 dark:bg-neutral-600 text-white')}>
                  {lampQuantity > 0 && cartCount > 0 ? <Check className="w-2.5 h-2.5" /> : '2'}
                </span>
                <span className={cn('text-xs font-semibold whitespace-nowrap', lampQuantity > 0 && cartCount === 0 ? 'text-experience-highlight' : lampQuantity > 0 && cartCount > 0 ? 'text-neutral-600 dark:text-neutral-400' : 'text-neutral-500 dark:text-neutral-500')}>
                  {lampQuantity === 0 ? 'Add your Art' : cartCount === 0 ? '' : 'Artwork added'}
                </span>
              </div>
              {lampQuantity > 0 && cartCount > 0 && (
                <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600 shrink-0" />
              )}
          </div>
        )}
    </>
  )
}
