import type { ReactNode } from 'react'
import { BackBar } from '@/components/shop/navigation'
import { ExperienceOrderProvider } from './ExperienceOrderContext'
import { ExperienceCartChip } from './ExperienceCartChip'

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
      <div className="fixed inset-0 z-[60] bg-neutral-950 overflow-hidden flex flex-col">
        <BackBar
          href="/shop/street-collector"
          label="Back"
          showLogo={false}
          rightSlot={<ExperienceCartChip variant="dark" />}
          className="shrink-0"
        />
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {children}
      </div>
    </div>
    </ExperienceOrderProvider>
  )
}
