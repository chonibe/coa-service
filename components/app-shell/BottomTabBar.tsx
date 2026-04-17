'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Compass,
  Grid3X3,
  Plus,
  Bell,
  User,
  Palette,
  BarChart3,
} from 'lucide-react'

// ============================================================================
// App Shell Bottom Tab Bar
//
// Persistent bottom navigation for Collector and Vendor experiences.
// Inspired by Instagram/Pinterest: 5 tabs, center "+" for vendors.
//
// - Maroon #390000 background with peach #ffba94 active state
// - min-h-[56px] with safe area padding for notched phones
// - Unread badge support on Inbox tab
// - On desktop (md+), transforms into a slim left rail (72px, icon-only)
// ============================================================================

export interface TabItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  activeIcon?: React.ReactNode
  /** Show a red dot badge (e.g. unread count) */
  badge?: number
  /** Center create button (vendor only) */
  isCreateButton?: boolean
}

export interface BottomTabBarProps {
  tabs: TabItem[]
  className?: string
  /** Callback when the create "+" button is tapped (vendor) */
  onCreatePress?: () => void
}

export function BottomTabBar({ tabs, className, onCreatePress }: BottomTabBarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-app-chrome border-t border-app-chrome-border',
          'pb-[var(--app-safe-bottom)]',
          className
        )}
        role="tablist"
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-[var(--app-tab-height)]">
          {tabs.map((tab) => {
            if (tab.isCreateButton) {
              return (
                <button
                  key={tab.id}
                  onClick={onCreatePress}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'w-12 h-10 rounded-xl',
                    'bg-impact-primary text-white',
                    'active:scale-95 transition-transform duration-100',
                    'shadow-impact-sm'
                  )}
                  aria-label={tab.label}
                >
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
              )
            }

            const active = isActive(tab.href)
            return (
              <Link
                key={tab.id}
                href={tab.href}
                role="tab"
                aria-selected={active}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5',
                  'min-w-[3rem] min-h-[2.75rem] px-1',
                  'transition-colors duration-200',
                  'active:scale-95 transition-transform duration-100',
                  active
                    ? 'text-app-chrome-text'
                    : 'text-app-chrome-inactive'
                )}
              >
                <span className="relative">
                  {active && tab.activeIcon ? tab.activeIcon : tab.icon}
                  {tab.badge && tab.badge > 0 ? (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1.5',
                        'min-w-[1rem] h-4 px-1',
                        'flex items-center justify-center',
                        'bg-impact-error text-white',
                        'text-[10px] font-bold leading-none',
                        'rounded-full'
                      )}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Left Rail */}
      <nav
        className={cn(
          'hidden md:flex fixed left-0 top-[var(--app-header-height)] bottom-0 z-40',
          'w-[var(--app-rail-width)] flex-col items-center',
          'bg-app-chrome border-r border-app-chrome-border',
          'py-4 gap-1',
          className
        )}
        role="tablist"
        aria-label="Main navigation"
      >
        {tabs.map((tab) => {
          if (tab.isCreateButton) {
            return (
              <button
                key={tab.id}
                onClick={onCreatePress}
                className={cn(
                  'flex items-center justify-center',
                  'w-11 h-11 rounded-xl mt-1',
                  'bg-impact-primary text-white',
                  'hover:opacity-85 active:scale-95',
                  'transition-all duration-200',
                  'shadow-impact-sm'
                )}
                aria-label={tab.label}
                title={tab.label}
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )
          }

          const active = isActive(tab.href)
          return (
            <Link
              key={tab.id}
              href={tab.href}
              role="tab"
              aria-selected={active}
              title={tab.label}
              className={cn(
                'relative flex items-center justify-center',
                'w-11 h-11 rounded-xl',
                'transition-all duration-200',
                'hover:bg-white/10',
                active
                  ? 'text-app-chrome-text bg-white/10'
                  : 'text-app-chrome-inactive'
              )}
            >
              {active && tab.activeIcon ? tab.activeIcon : tab.icon}
              {tab.badge && tab.badge > 0 ? (
                <span
                  className={cn(
                    'absolute top-1 right-1',
                    'min-w-[0.875rem] h-3.5 px-0.5',
                    'flex items-center justify-center',
                    'bg-impact-error text-white',
                    'text-[9px] font-bold leading-none',
                    'rounded-full'
                  )}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

// ============================================================================
// Pre-configured tab sets for each role
// ============================================================================

const ICON_SIZE = 'w-5 h-5'

export const collectorTabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/collector/home',
    icon: <Home className={ICON_SIZE} />,
    activeIcon: <Home className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'explore',
    label: 'Explore',
    href: '/collector/explore',
    icon: <Compass className={ICON_SIZE} />,
    activeIcon: <Compass className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'collection',
    label: 'Collection',
    href: '/collector/collection',
    icon: <Grid3X3 className={ICON_SIZE} />,
    activeIcon: <Grid3X3 className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    href: '/collector/inbox',
    icon: <Bell className={ICON_SIZE} />,
    activeIcon: <Bell className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/collector/profile',
    icon: <User className={ICON_SIZE} />,
    activeIcon: <User className={ICON_SIZE} strokeWidth={2.5} />,
  },
]

export const vendorTabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/vendor/home',
    icon: <Home className={ICON_SIZE} />,
    activeIcon: <Home className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'studio',
    label: 'Studio',
    href: '/vendor/studio',
    icon: <Palette className={ICON_SIZE} />,
    activeIcon: <Palette className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'create',
    label: 'Create',
    href: '#',
    icon: <Plus className={ICON_SIZE} />,
    isCreateButton: true,
  },
  {
    id: 'insights',
    label: 'Insights',
    href: '/vendor/insights',
    icon: <BarChart3 className={ICON_SIZE} />,
    activeIcon: <BarChart3 className={ICON_SIZE} strokeWidth={2.5} />,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/vendor/profile',
    icon: <User className={ICON_SIZE} />,
    activeIcon: <User className={ICON_SIZE} strokeWidth={2.5} />,
  },
]
