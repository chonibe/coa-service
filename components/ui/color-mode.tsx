"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

interface ColorModeProviderProps {
  children: ReactNode
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  )
}
