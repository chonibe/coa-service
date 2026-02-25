'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { SlimHeader, type SlimHeaderProps } from './SlimHeader'
import { BottomTabBar, type TabItem } from './BottomTabBar'
import { CartProvider } from '@/lib/shop/CartContext'
import { WishlistProvider } from '@/lib/shop/WishlistContext'

// ============================================================================
// App Shell
//
// Unified mobile-first layout wrapper for Collector and Vendor experiences.
// Provides the Instagram/Pinterest-like app structure:
//
//  +--------------------------------------------------+
//  | SlimHeader: Logo | Search | Bell | Cart           |
//  +--------------------------------------------------+
//  |                                                    |
//  |             Scrollable Content Area                |
//  |             (full bleed, edge to edge)             |
//  |                                                    |
//  +--------------------------------------------------+
//  | BottomTabBar: 5 tabs (or left rail on desktop)    |
//  +--------------------------------------------------+
//
// Wraps with CartProvider and WishlistProvider so collectors
// can add to cart from any tab.
// ============================================================================

export interface AppShellProps {
  /** Role-specific tab configuration */
  tabs: TabItem[]
  /** Props forwarded to SlimHeader */
  headerProps?: Partial<SlimHeaderProps>
  /** Callback when vendor "+" create button is pressed */
  onCreatePress?: () => void
  /** Additional className for the content area */
  contentClassName?: string
  children: React.ReactNode
}

function AppShellInner({
  tabs,
  headerProps,
  onCreatePress,
  contentClassName,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-app-content">
      {/* Header */}
      <SlimHeader {...headerProps} />

      {/* Content Area */}
      <main
        className={cn(
          // Top padding for fixed header
          'pt-[calc(var(--app-header-height)+var(--app-safe-top))]',
          // Bottom padding for fixed tab bar (mobile) or left padding (desktop)
          'pb-[calc(var(--app-tab-height)+var(--app-safe-bottom))]',
          'md:pb-0 md:pl-[var(--app-rail-width)]',
          contentClassName
        )}
      >
        {/* Desktop: constrain content width */}
        <div className="md:max-w-[var(--app-content-max-width)] md:mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Tabs / Desktop Rail */}
      <BottomTabBar tabs={tabs} onCreatePress={onCreatePress} />
    </div>
  )
}

/**
 * AppShell wraps the entire experience with providers.
 * Use this at the layout level for collector/vendor routes.
 */
export function AppShell(props: AppShellProps) {
  return (
    <CartProvider>
      <WishlistProvider>
        <AppShellInner {...props} />
      </WishlistProvider>
    </CartProvider>
  )
}
