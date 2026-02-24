import type { ReactNode } from 'react'

export default function ExperienceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] bg-neutral-950 overflow-hidden">
      <div className="w-full h-full relative">
        {children}
      </div>
    </div>
  )
}
