'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Menu, Search, ShoppingBag, X, User, ChevronDown } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/animations'
import { NavSearch } from './NavSearch'
import { StreetLampLogo } from './StreetLampLogo'
import type { NavItem } from '@/components/impact/Header'
import type { SearchResult } from '@/components/impact/SearchDrawer'

/**
 * MinifiedNavBar - Transforming navigation chip
 * 
 * Compact chip that expands into full menu modal.
 * Uses GSAP to morph between states.
 */

export interface MinifiedNavBarProps {
  isVisible: boolean
  isModalOpen: boolean
  cartCount?: number
  wishlistCount?: number
  logoSrc?: string
  navigation?: NavItem[]
  onToggleModal: () => void
  onCartClick?: () => void
  onWishlistClick?: () => void
  onSearchClick?: () => void
  onAccountClick?: () => void
  onSearch?: (query: string) => Promise<{ products: SearchResult[]; collections: SearchResult[] }>
  className?: string
}

export const MinifiedNavBar = React.forwardRef<HTMLDivElement, MinifiedNavBarProps>(
  (
    {
      isVisible,
      isModalOpen,
      cartCount = 0,
      wishlistCount = 0,
      logoSrc = 'https://cdn.shopify.com/s/files/1/0659/7925/2963/files/Logo_a395ed7f-3980-4407-80d0-70c343848544.png?v=1764246238',
      navigation = [],
      onToggleModal,
      onCartClick,
      onWishlistClick,
      onSearchClick,
      onAccountClick,
      onSearch,
      className,
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const chipRef = React.useRef<HTMLDivElement>(null)
    const modalContentRef = React.useRef<HTMLDivElement>(null)
    const backdropRef = React.useRef<HTMLDivElement>(null)
    const badgeRef = React.useRef<HTMLSpanElement>(null)
    const wishlistButtonRef = React.useRef<HTMLButtonElement>(null)

    // Transform chip into modal with smooth morph - no flashing
    useGSAP(() => {
      if (!containerRef.current || !chipRef.current || !modalContentRef.current || !backdropRef.current) return

      const chipContent = chipRef.current.querySelector('.chip-content') as HTMLElement
      const menuButton = chipContent?.querySelector('.menu-button') as HTMLElement
      const logoImg = chipContent?.querySelector('.logo-img') as HTMLElement
      const cartButton = chipContent?.querySelector('.cart-button') as HTMLElement
      const modalContent = modalContentRef.current

      if (isModalOpen) {
        const tl = gsap.timeline()

        // Fade in backdrop
        tl.to(backdropRef.current, {
          opacity: 1,
          pointerEvents: 'auto',
          duration: 0.4,
          ease: 'power2.out',
        }, 0)

        // Expand chip to modal size - menu, logo, cart stay visible throughout
        tl.to(chipRef.current, {
          width: '90vw',
          maxWidth: '1024px',
          height: '85vh',
          maxHeight: '700px',
          duration: 0.5,
          ease: 'power3.inOut',
        }, 0.15)

        // Adjust spacing as chip expands - icons stay visible
        tl.to(chipContent, {
          paddingLeft: '24px',
          paddingRight: '24px',
          paddingTop: '16px',
          paddingBottom: '16px',
          columnGap: '32px',
          duration: 0.5,
          ease: 'power3.inOut',
        }, 0.15)

        // Transform menu icon to X (using rotation/morph would be ideal, but we'll crossfade)
        if (menuButton) {
          tl.to(menuButton, {
            rotateZ: 90,
            duration: 0.25,
            ease: 'power2.inOut',
          }, 0.3)
        }

        // Show modal content (search bar and navigation items below)
        tl.set(modalContent, {
          visibility: 'visible',
          pointerEvents: 'auto',
        }, 0.5)

        // Show modal content below the chip header (which stays visible)
        tl.to(modalContent, {
          opacity: 1,
          duration: 0.3,
          ease: 'power2.out',
        }, 0.5)

        // Stagger reveal content items  
        const staggerItems = modalContent.querySelectorAll('.stagger-item')
        if (staggerItems.length > 0) {
          tl.fromTo(
            staggerItems,
            { opacity: 0, y: 15 },
            {
              opacity: 1,
              y: 0,
              duration: 0.3,
              stagger: 0.04,
              ease: 'power2.out',
            },
            0.6
          )
        }
      } else {
        const tl = gsap.timeline()

        // Hide modal content items first
        const staggerItems = modalContent.querySelectorAll('.stagger-item')
        if (staggerItems.length > 0) {
          tl.to(staggerItems, {
            opacity: 0,
            y: -10,
            duration: 0.15,
            stagger: 0.02,
            ease: 'power2.in',
          }, 0)
        }

        // Transform X back to menu icon
        if (menuButton) {
          tl.to(menuButton, {
            rotateZ: 0,
            duration: 0.25,
            ease: 'power2.inOut',
          }, 0.1)
        }

        // Fade out modal content
        tl.to(modalContent, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
        }, 0.15)

        tl.set(modalContent, {
          visibility: 'hidden',
          pointerEvents: 'none',
        }, 0.35)

        // Shrink back to chip size with reduced column gap
        tl.to(chipContent, {
          columnGap: '12px',
          paddingLeft: '16px',
          paddingRight: '16px',
          paddingTop: '10px',
          paddingBottom: '10px',
          duration: 0.4,
          ease: 'power3.inOut',
        }, 0.2)
        
        tl.to(chipRef.current, {
          width: 'auto',
          height: 'auto',
          duration: 0.4,
          ease: 'power3.inOut',
        }, 0.2)

        // Fade out backdrop
        tl.to(backdropRef.current, {
          opacity: 0,
          pointerEvents: 'none',
          duration: 0.3,
          ease: 'power2.in',
        }, 0.3)
      }
    }, { dependencies: [isModalOpen] })

    // Cart badge pop animation
    React.useEffect(() => {
      if (badgeRef.current && cartCount > 0) {
        gsap.fromTo(
          badgeRef.current,
          { scale: 0.5 },
          {
            scale: 1,
            duration: 0.4,
            ease: 'elastic.out(1.2, 0.4)',
          }
        )
      }
    }, [cartCount])

    // Wishlist heart fill and wiggle animation when items are added
    React.useEffect(() => {
      if (wishlistButtonRef.current && wishlistCount > 0) {
        const heartSvg = wishlistButtonRef.current.querySelector('svg')
        const heartPath = heartSvg?.querySelector('path')
        if (heartSvg && heartPath) {
          // Happy wiggle animation with temporary fill
          gsap.timeline()
            // Fill the heart with red
            .set(heartPath, { fill: '#f83a3a', stroke: '#f83a3a' })
            // Scale up
            .to(heartSvg, {
              scale: 1.3,
              duration: 0.2,
              ease: 'back.out(2)',
            }, 0)
            // Wiggle left
            .to(heartSvg, {
              rotation: -15,
              duration: 0.1,
              ease: 'power2.inOut',
            })
            // Wiggle right
            .to(heartSvg, {
              rotation: 15,
              duration: 0.15,
              ease: 'power2.inOut',
            })
            // Wiggle left
            .to(heartSvg, {
              rotation: -10,
              duration: 0.1,
              ease: 'power2.inOut',
            })
            // Wiggle right
            .to(heartSvg, {
              rotation: 10,
              duration: 0.1,
              ease: 'power2.inOut',
            })
            // Return to normal size and rotation
            .to(heartSvg, {
              rotation: 0,
              scale: 1,
              duration: 0.2,
              ease: 'back.out(1.5)',
            })
            // Fade fill back to outline
            .to(heartPath, {
              fill: 'none',
              stroke: 'currentColor',
              duration: 0.3,
              ease: 'power2.inOut',
            }, '-=0.1')
        }
      }
    }, [wishlistCount])

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isModalOpen) {
          onToggleModal()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isModalOpen, onToggleModal])

    // Prevent scroll when modal open
    React.useEffect(() => {
      if (isModalOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isModalOpen])

    return (
      <>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none"
          onClick={onToggleModal}
          aria-hidden="true"
        />

        {/* Transforming Container */}
        <div
          ref={containerRef}
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-50',
            className
          )}
          style={{
            willChange: 'transform',
          }}
        >
          <div
            ref={chipRef}
            className={cn(
              'relative overflow-hidden',
              'bg-[#390000] border border-[#ffba94]/20',
              'shadow-2xl backdrop-blur-xl',
              !isModalOpen && 'hover:scale-[1.02] transition-transform duration-200'
            )}
            style={{
              width: 'auto',
              height: 'auto',
              borderRadius: '24px',
              willChange: 'width, height',
            }}
          >
            {/* Chip Content (always visible at top) - Three column layout for perfect centering */}
            <div className="chip-content relative z-20 grid grid-cols-3 items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 pointer-events-auto">
              {/* Left: Menu Button */}
              <div className="flex justify-start pointer-events-auto">
                <button
                  type="button"
                  onClick={onToggleModal}
                  className="menu-button group p-1.5 sm:p-2 text-[#ffba94] flex-shrink-0 pointer-events-auto"
                  aria-label="Open navigation"
                >
                  <Menu size={20} className="sm:w-[22px] sm:h-[22px] group-hover:scale-110 group-hover:rotate-3 transition-all duration-200" />
                </button>
              </div>

              {/* Center: Logo - perfectly centered */}
              <div className="flex justify-center pointer-events-auto">
                <StreetLampLogo 
                  color="#ffba94"
                  height={24}
                  className="logo-img sm:h-7"
                />
              </div>

              {/* Right: Wishlist & Cart */}
              <div className="flex justify-end items-center gap-0.5 sm:gap-1 pointer-events-auto">
                {/* Wishlist */}
                <button
                  ref={wishlistButtonRef}
                  type="button"
                  onClick={onWishlistClick}
                  className="wishlist-button group relative p-1.5 sm:p-2 text-[#ffba94] flex-shrink-0 pointer-events-auto"
                  aria-label="Wishlist"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="sm:w-[22px] sm:h-[22px] group-hover:scale-110 transition-all duration-200"
                    style={{ transformOrigin: 'center center' }}
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                
                {/* Cart */}
                <button
                  type="button"
                  onClick={onCartClick}
                  className="cart-button group relative p-1.5 sm:p-2 text-[#ffba94] flex-shrink-0 pointer-events-auto"
                  aria-label={`Shopping cart${cartCount > 0 ? ` with ${cartCount} items` : ''}`}
                >
                  <ShoppingBag size={20} className="sm:w-[22px] sm:h-[22px] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-200" />
                  {cartCount > 0 && (
                    <span
                      ref={badgeRef}
                      className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-bold bg-[#f0c417] text-[#1a1a1a] rounded-full pointer-events-none border-2 border-[#390000]"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Content (visible when open) - positioned below chip header */}
            <div
              ref={modalContentRef}
              className="absolute left-0 right-0 opacity-0 invisible pointer-events-none z-10"
              style={{ 
                willChange: 'opacity',
                top: '64px',
                bottom: '0'
              }}
            >
              <div className="h-full flex flex-col bg-[#390000] overflow-hidden" style={{ borderRadius: '0 0 24px 24px' }}>
                {/* Search Bar - Expands below header */}
                {onSearch && (
                  <div className="stagger-item px-6 py-4 bg-[#390000] border-b border-[#ffba94]/10">
                    <NavSearch
                      onSearch={onSearch}
                      onResultClick={onToggleModal}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-[#390000]">
                  <div className="p-6 space-y-6">
                    {/* Navigation Menu */}
                    {navigation.length > 0 && (
                      <div className="stagger-item">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#ffba94]/50 mb-3 px-2">
                          Browse
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {navigation.map((item) => (
                            <NavMenuItem key={item.href} item={item} onNavigate={onToggleModal} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wishlist Button */}
                    {onWishlistClick && (
                      <div className="stagger-item">
                        <button
                          type="button"
                          onClick={() => {
                            onWishlistClick()
                            onToggleModal()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 bg-[#ffba94]/10 hover:bg-[#ffba94]/15 rounded-xl transition-colors group"
                        >
                          <div className="relative">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-[#f83a3a] group-hover:scale-110 transition-transform duration-200"
                            >
                              <path
                                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {wishlistCount > 0 && (
                              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold bg-[#f83a3a] text-white rounded-full">
                                {wishlistCount > 99 ? '99+' : wishlistCount}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-[#ffba94]">My Wishlist</span>
                          {wishlistCount > 0 && (
                            <span className="ml-auto text-sm text-[#ffba94]/60">
                              {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Account Button - at bottom */}
                    {onAccountClick && (
                      <div className="stagger-item">
                        <button
                          type="button"
                          onClick={() => {
                            onAccountClick()
                            onToggleModal()
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 bg-[#ffba94]/10 hover:bg-[#ffba94]/15 rounded-xl transition-colors"
                        >
                          <User size={20} className="text-[#ffba94]" />
                          <span className="font-medium text-[#ffba94]">My Account</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)
MinifiedNavBar.displayName = 'MinifiedNavBar'

/**
 * NavMenuItem Component
 */
interface NavMenuItemProps {
  item: NavItem
  onNavigate: () => void
}

function NavMenuItem({ item, onNavigate }: NavMenuItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div className="bg-[#ffba94]/10 rounded-xl p-4 border border-[#ffba94]/20">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-semibold text-[#ffba94]">{item.label}</span>
          <ChevronDown
            size={16}
            className={cn(
              'text-[#ffba94]/60 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
        {isExpanded && (
          <div className="space-y-1 mt-2">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className="block px-3 py-2 text-sm text-[#ffba94]/70 hover:text-[#ffba94] hover:bg-[#ffba94]/10 rounded-lg transition-colors"
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className="block bg-[#ffba94]/10 hover:bg-[#ffba94]/15 rounded-xl p-4 transition-colors border border-[#ffba94]/20"
    >
      <span className="font-semibold text-[#ffba94]">{item.label}</span>
    </Link>
  )
}
