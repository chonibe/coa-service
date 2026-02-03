'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { NavItem } from './Header'

/**
 * Mobile Menu Drawer
 * 
 * Full-screen mobile navigation drawer that slides in from the left.
 * Features expandable navigation sections and account links.
 */

export interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  navigation: NavItem[]
  logoSrc?: string
  onAccountClick?: () => void
  onSearchClick?: () => void
  className?: string
}

const MobileMenuDrawer = React.forwardRef<HTMLDivElement, MobileMenuDrawerProps>(
  (
    {
      isOpen,
      onClose,
      navigation,
      logoSrc,
      onAccountClick,
      onSearchClick,
      className,
    },
    ref
  ) => {
    const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

    // Close on escape key
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

    const toggleExpanded = (href: string) => {
      const newExpanded = new Set(expandedItems)
      if (newExpanded.has(href)) {
        newExpanded.delete(href)
      } else {
        newExpanded.add(href)
      }
      setExpandedItems(newExpanded)
    }

    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile menu"
          className={cn(
            'fixed top-0 left-0 z-50 h-full w-full max-w-sm',
            'bg-[#390000]',
            'transform transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : '-translate-x-full',
            className
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ffba94]/10">
              {logoSrc && (
                <img 
                  src={logoSrc} 
                  alt="Street Collector" 
                  className="h-8 w-auto"
                />
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-[#ffba94] hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6L18 18M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            {onSearchClick && (
              <div className="px-6 py-4 border-b border-[#ffba94]/10">
                <button
                  type="button"
                  onClick={() => {
                    onSearchClick()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#ffba94]/10 hover:bg-[#ffba94]/15 rounded-lg transition-colors min-h-[44px]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffba94" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16 16l4 4" />
                  </svg>
                  <span className="text-[#ffba94] text-sm">Search artworks...</span>
                </button>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <MobileNavItem
                    key={item.href}
                    item={item}
                    isExpanded={expandedItems.has(item.href)}
                    onToggle={() => toggleExpanded(item.href)}
                    onNavigate={onClose}
                  />
                ))}
              </div>
            </nav>

            {/* Footer Actions */}
            <div className="border-t border-[#ffba94]/10 px-6 py-4 space-y-2">
              {onAccountClick && (
                <button
                  type="button"
                  onClick={() => {
                    onAccountClick()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-[#ffba94] hover:bg-[#ffba94]/10 rounded-lg transition-colors min-h-[44px]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20C4 17 7 14 12 14C17 14 20 17 20 20" strokeLinecap="round" />
                  </svg>
                  <span className="font-medium">Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }
)
MobileMenuDrawer.displayName = 'MobileMenuDrawer'

/**
 * Mobile Nav Item Component
 */
interface MobileNavItemProps {
  item: NavItem
  isExpanded: boolean
  onToggle: () => void
  onNavigate: () => void
}

function MobileNavItem({ item, isExpanded, onToggle, onNavigate }: MobileNavItemProps) {
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center justify-between w-full py-3 px-4',
            'text-[#ffba94] hover:bg-[#ffba94]/10',
            'font-medium text-base',
            'transition-colors duration-200',
            'rounded-lg',
            'min-h-[44px]'
          )}
        >
          {item.label}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className={cn(
              'transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {isExpanded && (
          <div className="pl-4 pb-2 space-y-1">
            {item.children!.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className="block py-3 px-4 text-sm text-[#ffba94]/80 hover:text-white hover:bg-[#ffba94]/10 transition-colors rounded-lg min-h-[44px] flex items-center"
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
      className={cn(
        'block py-3 px-4',
        'text-[#ffba94] hover:bg-[#ffba94]/10',
        'font-medium text-base',
        'transition-colors duration-200',
        'rounded-lg',
        'min-h-[44px]',
        'flex items-center'
      )}
    >
      {item.label}
    </Link>
  )
}

export { MobileMenuDrawer }
