'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ThemeToggle — site-wide light/dark switch backed by next-themes.
 *
 * Rendered in the Footer bottom bar (components/impact/Footer.tsx).
 * Hydration-safe: renders an inert placeholder until mounted so the
 * server markup never disagrees with the client-resolved theme.
 *
 * Docs: docs/features/theme-toggle/README.md
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      aria-label="Toggle light/dark theme"
      title={mounted ? (isDark ? 'Switch to light mode' : 'Switch to dark mode') : 'Toggle theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-full',
        'border border-[#ffba94]/20 text-[#ffba94]/80',
        'transition-colors hover:border-[#ffba94]/40 hover:text-[#ffba94]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ffba94]/60',
        className
      )}
    >
      {/* Until mounted, show the moon (matches the dark default) to avoid hydration mismatch */}
      {mounted && !isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  )
}
