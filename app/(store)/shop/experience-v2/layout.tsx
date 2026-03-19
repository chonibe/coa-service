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
          <div className="fixed inset-0 z-[60] h-dvh max-h-dvh bg-white dark:bg-[#171515] overflow-hidden flex flex-col">
            <ExperienceSlideoutMenu />
            <div className="flex-1 min-h-0 min-w-0 relative overflow-hidden">
              {children}
            </div>
          </div>
        </ExperienceAuthProvider>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
