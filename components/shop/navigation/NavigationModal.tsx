'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ChevronDown, User, X } from 'lucide-react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/animations'
import { NavSearch } from './NavSearch'
import type { NavItem } from '@/components/impact/Header'
import type { SearchResult } from '@/components/impact/SearchDrawer'

/**
 * NavigationModal - Center-screen unified navigation overlay
 * 
 * Expands from minified bar with GSAP animations.
 * Contains search, navigation menu, and cart preview.
 */

export interface NavigationModalProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavItem[]
  // Search
  onSearch: (query: string) => Promise<{ products: SearchResult[]; collections: SearchResult[] }>
  // Account
  onAccountClick?: () => void
  className?: string
}

export const NavigationModal = React.forwardRef<HTMLDivElement, NavigationModalProps>(
  (
    {
      isOpen,
      onClose,
      navigation,
      onSearch,
      onAccountClick,
      className,
    },
    ref
  ) => {
    const modalRef = React.useRef<HTMLDivElement>(null)
    const backdropRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Animate modal
    useGSAP(() => {
      if (!modalRef.current || !backdropRef.current || !contentRef.current) return

      if (isOpen) {
        // Open animation
        const tl = gsap.timeline()

        // Backdrop fade
        tl.to(backdropRef.current, {
          opacity: 1,
          pointerEvents: 'auto',
          visibility: 'visible',
          duration: 0.3,
          ease: 'power2.out',
        })

        // Modal scale from center
        tl.fromTo(
          modalRef.current,
          { scale: 0.3, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            pointerEvents: 'auto',
            visibility: 'visible',
            duration: 0.4,
            ease: 'power3.out',
          },
          0.05
        )

        // Stagger content
        tl.fromTo(
          contentRef.current.querySelectorAll('.stagger-item'),
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: 'power2.out',
          },
          0.2
        )
      } else {
        // Close animation
        const tl = gsap.timeline()

        tl.to(modalRef.current, {
          scale: 0.3,
          opacity: 0,
          pointerEvents: 'none',
          duration: 0.3,
          ease: 'power2.in',
        })

        tl.to(
          backdropRef.current,
          {
            opacity: 0,
            pointerEvents: 'none',
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
              if (backdropRef.current) {
                gsap.set(backdropRef.current, { visibility: 'hidden' })
              }
              if (modalRef.current) {
                gsap.set(modalRef.current, { visibility: 'hidden' })
              }
            },
          },
          0.1
        )
      }
    }, { dependencies: [isOpen] })

    // Close on escape
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    // Prevent scroll when open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
      return () => {
        document.body.style.overflow = ''
      }
    }, [isOpen])

    // Merge refs
    const mergedRef = React.useMemo(() => {
      return (node: HTMLDivElement | null) => {
        modalRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      }
    }, [ref])

    return (
      <>
        {/* Backdrop */}
        <div
          ref={backdropRef}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm opacity-0 invisible pointer-events-none"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div
          ref={mergedRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[calc(100%-2rem)] max-w-4xl h-[calc(100%-8rem)] max-h-[700px]',
            'bg-white rounded-3xl shadow-2xl',
            'overflow-hidden',
            'opacity-0 invisible pointer-events-none',
            className
          )}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          <div ref={contentRef} className="h-full flex flex-col">
            {/* Header */}
            <div className="stagger-item flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]/5">
              <h2 className="text-lg font-semibold text-[#1a1a1a]">Menu</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-[#f5f5f5] rounded-full transition-colors"
                aria-label="Close menu"
              >
                <X size={20} className="text-[#1a1a1a]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Search */}
                <div className="stagger-item">
                  <NavSearch
                    onSearch={onSearch}
                    onResultClick={onClose}
                  />
                </div>

                {/* Navigation Menu */}
                <div className="stagger-item">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1a1a1a]/50 mb-3 px-2">
                    Browse
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {navigation.map((item) => (
                      <NavMenuItem key={item.href} item={item} onNavigate={onClose} />
                    ))}
                  </div>
                </div>

                {/* Account */}
                {onAccountClick && (
                  <div className="stagger-item">
                    <button
                      type="button"
                      onClick={() => {
                        onAccountClick()
                        onClose()
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-xl transition-colors"
                    >
                      <User size={20} className="text-[#1a1a1a]/60" />
                      <span className="font-medium text-[#1a1a1a]">My Account</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)
NavigationModal.displayName = 'NavigationModal'

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
      <div className="bg-[#f5f5f5] rounded-xl p-4">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left mb-2"
        >
          <span className="font-semibold text-[#1a1a1a]">{item.label}</span>
          <ChevronDown
            size={16}
            className={cn(
              'text-[#1a1a1a]/60 transition-transform duration-200',
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
                className="block px-3 py-2 text-sm text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-white rounded-lg transition-colors"
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
      className="block bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-xl p-4 transition-colors"
    >
      <span className="font-semibold text-[#1a1a1a]">{item.label}</span>
    </Link>
  )
}
