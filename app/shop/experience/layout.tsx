import type { ReactNode } from 'react'
import { ExperienceOrderProvider } from './ExperienceOrderContext'
import { ExperienceSlideoutMenu } from './ExperienceSlideoutMenu'
import { SplineScenePreload } from './SplineScenePreload'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
}

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return (
    <ExperienceOrderProvider>
      <SplineScenePreload />
      <div className="fixed inset-0 z-[60] bg-neutral-950 overflow-hidden flex flex-col">
        <ExperienceSlideoutMenu />
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {children}
        </div>
      </div>
    </ExperienceOrderProvider>
  )
}
