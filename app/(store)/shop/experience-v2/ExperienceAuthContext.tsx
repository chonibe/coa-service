'use client'

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const ONBOARDING_LOGIN_REDIRECT = '/shop/experience-v2?fromOnboardingLogin=1'

export interface ExperienceAuthContextValue {
  /** Open the slideout menu and auth (e.g. from onboarding "Log in"). Use redirectPath to send user after login (e.g. with fromOnboardingLogin=1). */
  openAuth: (redirectPath?: string) => void
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  /** When true, ShopSlideoutMenu should open auth as soon as the menu opens */
  openAuthWhenMenuOpens: boolean
  setOpenAuthWhenMenuOpens: (v: boolean) => void
  /** Override redirect for AuthSlideupMenu when opened from onboarding */
  onboardingRedirectPath: string | null
  clearOnboardingRedirect: () => void
}

const ExperienceAuthContext = createContext<ExperienceAuthContextValue | undefined>(undefined)

export function useExperienceAuthContext(): ExperienceAuthContextValue {
  const ctx = useContext(ExperienceAuthContext)
  if (ctx === undefined) {
    throw new Error('useExperienceAuthContext must be used within ExperienceAuthProvider')
  }
  return ctx
}

export function ExperienceAuthProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openAuthWhenMenuOpens, setOpenAuthWhenMenuOpens] = useState(false)
  const [onboardingRedirectPath, setOnboardingRedirectPath] = useState<string | null>(null)

  const openAuth = useCallback((redirectPath?: string) => {
    setMenuOpen(true)
    setOpenAuthWhenMenuOpens(true)
    setOnboardingRedirectPath(redirectPath ?? ONBOARDING_LOGIN_REDIRECT)
  }, [])

  const clearOnboardingRedirect = useCallback(() => {
    setOnboardingRedirectPath(null)
  }, [])

  const value: ExperienceAuthContextValue = {
    openAuth,
    menuOpen,
    setMenuOpen,
    openAuthWhenMenuOpens,
    setOpenAuthWhenMenuOpens,
    onboardingRedirectPath,
    clearOnboardingRedirect,
  }

  return (
    <ExperienceAuthContext.Provider value={value}>
      {children}
    </ExperienceAuthContext.Provider>
  )
}
