'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Gift,
  TicketPercent,
  Clock,
  HelpCircle,
  MessageCircle,
  User,
  Moon,
  Sun,
  Ruler,
  Palette,
  Users,
  Home,
  X,
} from 'lucide-react'
import { Sheet } from '@/components/ui'
import { AuthSlideupMenu } from '@/components/shop/auth/AuthSlideupMenu'
import { PromoCodeModal } from '@/components/shop/checkout/PromoCodeModal'
import { getProxiedImageUrl } from '@/lib/proxy-cdn-url'
import { validatePromo } from '@/lib/shop/useValidatePromo'
import { useShopAuthContext } from '@/lib/shop/ShopAuthContext'
import { useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { openTawkChat } from '@/lib/tawk'
import { cn } from '@/lib/utils'

const THE_ARTISTS_HREF = '/shop/explore-artists'

const MENU_ITEMS = [
  { label: 'Buy Gift Card', href: '/shop/gift-cards', icon: Gift },
  { label: 'Promo Codes', icon: TicketPercent, openPromoModal: true },
  { label: 'My Orders', href: '/shop/account', icon: Clock },
  { label: 'Help Center', href: '/shop/faq', icon: HelpCircle },
  { label: 'Chat with Us', href: '#', icon: MessageCircle, onClick: openTawkChat },
] as const

export interface ShopSlideoutMenuProps {
  open: boolean
  onClose: () => void
  theme?: 'light' | 'dark'
  authRedirectTo?: string
  /** When true, open auth slideup as soon as the menu opens (e.g. from onboarding "Log in") */
  openAuthWhenOpened?: boolean
  /** Called after opening auth when openAuthWhenOpened was true (so parent can clear the flag) */
  onAuthOpened?: () => void
  /** When set, show logo linking to this href instead of "Menu" title in header */
  logoHref?: string
  /** For experience page: promo/order state from OrderContext */
  promoCode?: string
  promoDiscount?: number
  onPromoChange?: (code: string, discount: number) => void
  orderTotal?: number
  volumeDiscountLabel?: string
  volumeDiscountDescription?: string
  /** When false, hide Promo Codes menu item (e.g. until configured in Stripe) */
  showPromoCodes?: boolean
  /** When true, show Light/Dark mode toggle (experience page) */
  showThemeToggle?: boolean
  /** Experience: open Street Lamp product detail (includes/specs slideout); menu closes first */
  onSpecifications?: () => void
  /** Experience: open artwork collection picker; menu closes first (shown under Specifications when set) */
  onChooseYourArt?: () => void
  /** Label for collection picker menu item (default: Choose your Art) */
  chooseYourArtLabel?: string
  /** Icon for collection picker menu item (default: Palette) */
  chooseYourArtIcon?: LucideIcon
}

/**
 * Shared slideout menu used by Experience header and street-collector top bar.
 * Same menu content: auth, Buy Gift Card, Promo Codes, My Orders, Help Center, Chat.
 */
const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Group_707.png?v=1767356535'
const QUIZ_STORAGE_KEY = 'sc-experience-quiz'

const menuRowClass =
  'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/80 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const slideoutCtaClass = cn(
  'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
  'bg-experience-highlight text-neutral-900 hover:bg-experience-highlight/90',
  'dark:text-neutral-900'
)

function SlideoutMenuIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
      <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.75} aria-hidden />
    </span>
  )
}

function SlideoutMenuRowButton({
  icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className={menuRowClass}>
      <SlideoutMenuIcon icon={icon} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  )
}

function SlideoutMenuRowLink({
  icon,
  label,
  href,
  onNavigate,
}: {
  icon: LucideIcon
  label: string
  href: string
  onNavigate: () => void
}) {
  return (
    <Link href={href} onClick={onNavigate} className={menuRowClass}>
      <SlideoutMenuIcon icon={icon} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  )
}

function SlideoutMenuSection({
  title,
  children,
  className,
}: {
  title?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('px-2', className)}>
      {title ? (
        <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
      ) : null}
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  )
}

function SlideoutMenuDivider() {
  return <div className="mx-4 my-2 border-t border-border/80" role="separator" />
}

function getQuizName(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { name?: string }
    return parsed.name?.trim() || null
  } catch {
    return null
  }
}

export function ShopSlideoutMenu({
  open,
  onClose,
  theme = 'light',
  authRedirectTo = '/experience',
  openAuthWhenOpened = false,
  onAuthOpened,
  logoHref,
  promoCode: controlledPromoCode,
  promoDiscount: controlledPromoDiscount,
  onPromoChange,
  orderTotal = 0,
  volumeDiscountLabel,
  volumeDiscountDescription,
  showPromoCodes = false,
  showThemeToggle = false,
  onSpecifications,
  onChooseYourArt,
  chooseYourArtLabel = 'Choose your Art',
  chooseYourArtIcon: ChooseYourArtIcon = Palette,
}: ShopSlideoutMenuProps) {
  const pathname = usePathname()
  const isOnExploreArtists =
    pathname === '/explore-artists' ||
    pathname === '/shop/explore-artists' ||
    pathname?.startsWith('/shop/explore-artists/')
  const [authOpen, setAuthOpen] = useState(false)
  const { theme: experienceTheme, setTheme: setExperienceTheme } = useExperienceTheme()
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [quizName, setQuizName] = useState<string | null>(null)
  const { user, isAuthenticated, loading } = useShopAuthContext()

  useEffect(() => {
    if (open) setQuizName(getQuizName())
  }, [open])

  useEffect(() => {
    if (open && openAuthWhenOpened) {
      setAuthOpen(true)
      onAuthOpened?.()
    }
  }, [open, openAuthWhenOpened, onAuthOpened])

  const useControlledPromo = onPromoChange != null
  const [localPromoCode, setLocalPromoCode] = useState('')
  const [localPromoDiscount, setLocalPromoDiscount] = useState(0)
  const promoCode = useControlledPromo ? (controlledPromoCode ?? '') : localPromoCode
  const promoDiscount = useControlledPromo ? (controlledPromoDiscount ?? 0) : localPromoDiscount

  const handlePromoApply = async (code: string) => {
    const { valid, discountCents } = await validatePromo(code, Math.round(orderTotal * 100))
    const discount = valid ? discountCents / 100 : 0
    if (useControlledPromo && onPromoChange) {
      onPromoChange(code, discount)
    } else {
      setLocalPromoCode(code)
      setLocalPromoDiscount(discount)
    }
  }

  const handlePromoRemove = () => {
    if (useControlledPromo && onPromoChange) {
      onPromoChange('', 0)
    } else {
      setLocalPromoCode('')
      setLocalPromoDiscount(0)
    }
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        side="left"
        overlayClassName="z-[70]"
        className="!top-0 !bottom-0 !h-full !max-w-[min(100vw,20rem)] !min-h-0 !overflow-hidden !rounded-none !border-r !p-0 sm:!max-w-xs"
        contentClassName="!min-h-0 !overflow-hidden !p-0"
        theme={theme}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <Link
              href={logoHref ?? '/'}
              onClick={onClose}
              className="flex min-w-0 items-center gap-2.5"
              aria-label="Street Collector home"
            >
              <img
                src={getProxiedImageUrl(LOGO_URL)}
                alt="Street Collector"
                className="h-7 w-auto shrink-0 object-contain"
                width={80}
                height={28}
              />
            </Link>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="shrink-0 px-4 py-4">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                {!loading && isAuthenticated && user ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold leading-snug text-foreground">
                        Welcome back{user.firstName ? `, ${user.firstName}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">Your progress is saved.</p>
                    </div>
                    <Link
                      href="/shop/account"
                      onClick={onClose}
                      className={slideoutCtaClass}
                    >
                      <User className="size-4 shrink-0" aria-hidden />
                      View My Account
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {quizName ? (
                        <p className="text-sm font-semibold leading-snug text-foreground">Hi {quizName}</p>
                      ) : null}
                      <p className="text-sm leading-snug text-foreground">
                        <span className="font-semibold">Sign up</span> to save your progress and track orders.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        setAuthOpen(true)
                      }}
                      className={slideoutCtaClass}
                    >
                      Login or Sign Up
                    </button>
                  </div>
                )}
              </div>
            </div>

            <nav className="shrink-0 pb-2" aria-label="Shop menu">
              <SlideoutMenuSection title="Browse">
                <SlideoutMenuRowLink icon={Home} label="Back to Home" href="/" onNavigate={onClose} />
                {onChooseYourArt ? (
                  <SlideoutMenuRowButton
                    icon={ChooseYourArtIcon}
                    label={chooseYourArtLabel}
                    onClick={() => {
                      onClose()
                      onChooseYourArt()
                    }}
                  />
                ) : null}
                {onSpecifications ? (
                  <SlideoutMenuRowButton
                    icon={Ruler}
                    label="Specifications"
                    onClick={() => {
                      onClose()
                      onSpecifications()
                    }}
                  />
                ) : null}
                {!isOnExploreArtists ? (
                  <SlideoutMenuRowLink
                    icon={Users}
                    label="The Artists"
                    href={THE_ARTISTS_HREF}
                    onNavigate={onClose}
                  />
                ) : null}
              </SlideoutMenuSection>

              <SlideoutMenuDivider />

              <SlideoutMenuSection title="Account">
                {MENU_ITEMS.filter((item) => showPromoCodes || !('openPromoModal' in item && item.openPromoModal)).map(
                  (item) => {
                    const Icon = item.icon
                    if ('openPromoModal' in item && item.openPromoModal) {
                      return (
                        <SlideoutMenuRowButton
                          key={item.label}
                          icon={Icon}
                          label={item.label}
                          onClick={() => {
                            onClose()
                            setPromoModalOpen(true)
                          }}
                        />
                      )
                    }
                    if ('onClick' in item && typeof item.onClick === 'function') {
                      return (
                        <SlideoutMenuRowButton
                          key={item.label}
                          icon={Icon}
                          label={item.label}
                          onClick={() => {
                            item.onClick!()
                            onClose()
                          }}
                        />
                      )
                    }
                    return (
                      <SlideoutMenuRowLink
                        key={item.label}
                        icon={Icon}
                        label={item.label}
                        href={'href' in item ? item.href : '#'}
                        onNavigate={onClose}
                      />
                    )
                  }
                )}
              </SlideoutMenuSection>

              {showThemeToggle ? (
                <>
                  <SlideoutMenuDivider />
                  <SlideoutMenuSection title="Preferences">
                    <SlideoutMenuRowButton
                      icon={experienceTheme === 'light' ? Moon : Sun}
                      label={experienceTheme === 'light' ? 'Dark mode' : 'Light mode'}
                      onClick={() => setExperienceTheme(experienceTheme === 'light' ? 'dark' : 'light')}
                    />
                  </SlideoutMenuSection>
                </>
              ) : null}
            </nav>
          </div>
        </div>
      </Sheet>

      <AuthSlideupMenu open={authOpen} onClose={() => setAuthOpen(false)} redirectTo={authRedirectTo} />

      {showPromoCodes && (
        <PromoCodeModal
          open={promoModalOpen}
          onOpenChange={setPromoModalOpen}
          appliedCode={promoCode}
          appliedDiscount={promoDiscount}
          onApply={handlePromoApply}
          onRemove={handlePromoRemove}
          volumeDiscountLabel={volumeDiscountLabel}
          volumeDiscountDescription={volumeDiscountDescription}
        />
      )}
    </>
  )
}
