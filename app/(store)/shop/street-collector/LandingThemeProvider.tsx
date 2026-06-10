'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LandingAppearance = 'light' | 'dark'

const STORAGE_KEY = 'sc-landing-appearance'

type LandingAppearanceContextValue = {
  appearance: LandingAppearance
  setAppearance: (value: LandingAppearance) => void
  toggleAppearance: () => void
}

const LandingAppearanceContext = createContext<LandingAppearanceContextValue | null>(
  null
)

export function useLandingAppearance(): LandingAppearanceContextValue | null {
  return useContext(LandingAppearanceContext)
}

/**
 * Wraps `/` and `/shop/street-collector` so Tailwind `dark:` variants follow a local
 * light/dark choice (not the global app theme, which stays forced light in root layout).
 */
export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<LandingAppearance>('light')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw === 'dark' || raw === 'light') {
        setAppearanceState(raw)
        return
      }
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        setAppearanceState('dark')
      }
    } catch {
      // ignore
    }
  }, [])

  const setAppearance = useCallback((value: LandingAppearance) => {
    setAppearanceState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore
    }
  }, [])

  const toggleAppearance = useCallback(() => {
    setAppearanceState((prev) => {
      const next: LandingAppearance = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ appearance, setAppearance, toggleAppearance }),
    [appearance, setAppearance, toggleAppearance]
  )

  return (
    <LandingAppearanceContext.Provider value={value}>
      <div
        className={cn(
          appearance === 'dark' && 'dark',
          'flex min-h-screen flex-col bg-[#faf6f2] dark:bg-[#171515]'
        )}
      >
        {children}
      </div>
    </LandingAppearanceContext.Provider>
  )
}

/** Mobile-only FAB — desktop toggle lives in `DesktopTopBar`. */
export function LandingAppearanceFab() {
  const ctx = useLandingAppearance()
  if (!ctx) return null
  const isDark = ctx.appearance === 'dark'
  return (
    <button
      type="button"
      onClick={ctx.toggleAppearance}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'fixed right-3 z-[126] flex h-10 w-10 items-center justify-center rounded-full border shadow-md md:hidden',
        'border-stone-300/90 bg-white/95 text-stone-800 backdrop-blur-sm',
        'dark:border-white/15 dark:bg-[#201c1c]/90 dark:text-[#FFBA94]',
        'transition-colors hover:opacity-95 active:opacity-90',
        'top-[calc(2.125rem+env(safe-area-inset-top,0px)+0.5rem)]'
      )}
    >
      {isDark ? <Sun className="h-5 w-5" strokeWidth={1.75} /> : <Moon className="h-5 w-5" strokeWidth={1.75} />}
    </button>
  )
}
