import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ExperienceOrderProvider } from './ExperienceOrderContext'
import { ExperienceThemeProvider } from './ExperienceThemeContext'
import { ExperienceAuthProvider } from './ExperienceAuthContext'

const ExperienceSlideoutMenu = dynamic(
  () => import('./ExperienceSlideoutMenu').then((m) => ({ default: m.ExperienceSlideoutMenu }))
)

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function ExperienceV2Layout({ children }: { children: ReactNode }) {
  return (
    <ExperienceOrderProvider>
      <ExperienceThemeProvider>
        <ExperienceAuthProvider>
          <div className="relative z-[60] flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-background">
            <ExperienceSlideoutMenu />
            <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
              {children}
            </div>
          </div>
        </ExperienceAuthProvider>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
