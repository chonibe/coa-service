import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { ExperienceOrderProvider } from '../experience-v2/ExperienceOrderContext'
import { ExperienceThemeProvider } from '../experience-v2/ExperienceThemeContext'
import { ExperienceAuthProvider } from '../experience-v2/ExperienceAuthContext'

const ExperienceSlideoutMenu = dynamic(
  () => import('../experience-v2/ExperienceSlideoutMenu').then((m) => ({ default: m.ExperienceSlideoutMenu }))
)

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function ExperienceV3Layout({ children }: { children: ReactNode }) {
  return (
    <ExperienceOrderProvider>
      <ExperienceThemeProvider>
        <ExperienceAuthProvider>
          <div className="fixed inset-0 z-[60] flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-background">
            <ExperienceSlideoutMenu />
            <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
          </div>
        </ExperienceAuthProvider>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
