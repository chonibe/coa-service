import type { ReactNode } from 'react'
import { ExperienceOrderProvider } from '../experience-v2/ExperienceOrderContext'
import { ExperienceThemeProvider } from '../experience-v2/ExperienceThemeContext'
import { ExperienceAuthProvider } from '../experience-v2/ExperienceAuthContext'
import { ExperienceSlideoutMenu } from '../experience-v2/ExperienceSlideoutMenu'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Preload Spline scene in the HTML <head> so the 6.7MB download starts as soon
          as the page is parsed — 2-3s earlier than the useEffect approach. */}
      <link
        rel="preload"
        href="/spline/splinemodel2/scene.splinecode"
        as="fetch"
        crossOrigin="anonymous"
      />
      <ExperienceOrderProvider>
        <ExperienceThemeProvider>
          <ExperienceAuthProvider>
            <div className="fixed inset-0 z-[60] bg-white dark:bg-[#171515] overflow-hidden flex flex-col">
              <ExperienceSlideoutMenu />
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {children}
              </div>
            </div>
          </ExperienceAuthProvider>
        </ExperienceThemeProvider>
      </ExperienceOrderProvider>
    </>
  )
}
