'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

type ExperienceTheme = 'light' | 'dark'

interface ExperienceThemeContextValue {
  theme: ExperienceTheme
  setTheme: (theme: ExperienceTheme) => void
}

export const ExperienceThemeContext = createContext<ExperienceThemeContextValue | null>(null)

/**
 * ExperienceThemeProvider — thin adapter over the global next-themes provider.
 *
 * Historically the experience pages kept their own localStorage-backed theme
 * and a local `.dark` wrapper div. Now the whole site is themeable via
 * next-themes (html-level class), so this provider simply exposes the global
 * theme through the existing Experience API to avoid touching every consumer.
 *
 * Docs: docs/features/theme-toggle/README.md
 */
export function ExperienceThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setTheme: setGlobalTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Before mount, report the site default (dark) to match server markup.
  const theme: ExperienceTheme = mounted && resolvedTheme === 'light' ? 'light' : 'dark'

  const setTheme = React.useCallback(
    (value: ExperienceTheme) => {
      setGlobalTheme(value)
    },
    [setGlobalTheme]
  )

  return (
    <ExperienceThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ExperienceThemeContext.Provider>
  )
}

export function useExperienceTheme() {
  const ctx = useContext(ExperienceThemeContext)
  if (!ctx) {
    return { theme: 'light' as const, setTheme: () => {} }
  }
  return ctx
}
