'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'experience-theme'

type ExperienceTheme = 'light' | 'dark'

interface ExperienceThemeContextValue {
  theme: ExperienceTheme
  setTheme: (theme: ExperienceTheme) => void
}

const ExperienceThemeContext = createContext<ExperienceThemeContextValue | null>(null)

export function ExperienceThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ExperienceTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ExperienceTheme | null
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored)
    }
    setMounted(true)
  }, [])

  const setTheme = React.useCallback((value: ExperienceTheme) => {
    setThemeState(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, value)
    }
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ExperienceThemeContext.Provider value={{ theme, setTheme }}>
      <div className={theme === 'dark' ? 'dark' : ''}>{children}</div>
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
