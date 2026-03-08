import type { ReactNode } from 'react'
import { ExperienceOrderProvider } from './ExperienceOrderContext'
import { ExperienceThemeProvider } from './ExperienceThemeContext'
import { ExperienceSlideoutMenu } from './ExperienceSlideoutMenu'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return (
    <ExperienceOrderProvider>
      <ExperienceThemeProvider>
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#171515] overflow-hidden flex flex-col">
          <ExperienceSlideoutMenu />
          <div className="flex-1 min-h-0 relative overflow-hidden">
            {children}
          </div>
        </div>
      </ExperienceThemeProvider>
    </ExperienceOrderProvider>
  )
}
