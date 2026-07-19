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
            {/*
              Absolute fill (not only flex-1 + h-full) so the inner overflow-y-auto
              scrollport stays height-bounded on iOS when html/body use min-height
              instead of height: 100%.
            */}
            <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
              <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">{children}</div>
            </div>
          </div>
        </ExperienceAuthProvider>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
