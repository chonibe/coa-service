'use client'

/**
 * @deprecated Use `useTheme()` from `next-themes` directly.
 * Kept for backward-compatible imports during theme migration.
 */
import { useTheme } from 'next-themes'

export type LandingAppearance = 'light' | 'dark'

type LandingAppearanceContextValue = {
  appearance: LandingAppearance
  setAppearance: (value: LandingAppearance) => void
  toggleAppearance: () => void
}

/** @deprecated Use `useTheme()` from `next-themes`. */
export function useLandingAppearance(): LandingAppearanceContextValue | null {
  const { resolvedTheme, setTheme } = useTheme()
  if (!resolvedTheme) return null
  const appearance: LandingAppearance = resolvedTheme === 'light' ? 'light' : 'dark'
  return {
    appearance,
    setAppearance: (value) => setTheme(value),
    toggleAppearance: () => setTheme(appearance === 'dark' ? 'light' : 'dark'),
  }
}

/** @deprecated Global next-themes handles theming on `<html>`. */
export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/** @deprecated Use footer ThemeToggle or global theme controls. */
export function LandingAppearanceFab() {
  return null
}
