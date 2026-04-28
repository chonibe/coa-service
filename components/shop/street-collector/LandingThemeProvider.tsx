'use client'

import { ExperienceThemeProvider, useExperienceTheme } from '@/app/(store)/shop/experience-v2/ExperienceThemeContext'
import { cn } from '@/lib/utils'

function LandingThemeSurface({ children }: { children: React.ReactNode }) {
  const { theme } = useExperienceTheme()
  const isDark = theme === 'dark'
  return (
    <div
      className={cn(
        'min-w-0 w-full flex-1',
        isDark ? 'dark bg-[#171515] text-[#FFBA94]' : 'bg-[#faf8f5] text-stone-900'
      )}
    >
      {children}
    </div>
  )
}

/**
 * Theme + surface for `/` and `/shop/street-collector` only (not home-v2).
 * Pairs with `StreetCollectorLandingShell` and `DesktopTopBar` (menu theme toggle).
 */
export function LandingThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ExperienceThemeProvider>
      <LandingThemeSurface>{children}</LandingThemeSurface>
    </ExperienceThemeProvider>
  )
}
