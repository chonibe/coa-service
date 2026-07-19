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
          <div className="relative z-[60] flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-background">
            <ExperienceSlideoutMenu />
            <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
              <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">{children}</div>
            </div>
          </div>
        </ExperienceAuthProvider>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
