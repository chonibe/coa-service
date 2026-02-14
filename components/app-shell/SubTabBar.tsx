'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// ============================================================================
// App Shell Sub-Tab Bar
//
// Horizontal pill-style sub-navigation within a main tab.
// Like Instagram's profile tabs (Posts / Reels / Tagged) but as scrollable pills.
//
// Used in:
// - Collector Collection: Grid / Editions / Series / Artists
// - Vendor Studio: Artworks / Series / Media
// - Vendor Insights: Overview / Payouts / Collectors
// - Inbox: Activity / Notifications (or Messages / Notifications)
// ============================================================================

export interface SubTab {
  id: string
  label: string
  href: string
  /** Optional count badge */
  count?: number
}

export interface SubTabBarProps {
  tabs: SubTab[]
  className?: string
  /** Sticky positioning offset from top (default: header height) */
  stickyTop?: string
}

export function SubTabBar({
  tabs,
  className,
  stickyTop = 'var(--app-header-height)',
}: SubTabBarProps) {
  const pathname = usePathname()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const isActive = (href: string) => {
    // Exact match for the tab route or parent-matches
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Auto-scroll the active tab into view
  React.useEffect(() => {
    if (!scrollRef.current) return
    const activeEl = scrollRef.current.querySelector('[data-active="true"]')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [pathname])

  return (
    <div
      className={cn(
        'sticky z-30 bg-app-content',
        'border-b border-gray-100',
        className
      )}
      style={{ top: stickyTop }}
    >
      <div
        ref={scrollRef}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5',
          'overflow-x-auto scrollbar-hide',
          '-mx-px' // prevent border clipping
        )}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.href)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-active={active}
              className={cn(
                'flex items-center gap-1.5 shrink-0',
                'px-4 py-1.5 rounded-full',
                'text-sm font-semibold font-body',
                'transition-all duration-200',
                'whitespace-nowrap',
                active
                  ? 'bg-[#390000] text-[#ffba94]'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300'
              )}
            >
              {tab.label}
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center',
                    'min-w-[1.25rem] h-5 px-1.5',
                    'text-[11px] font-bold rounded-full',
                    active
                      ? 'bg-[#ffba94]/20 text-[#ffba94]'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
