"use client"

import type { ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui"

interface WizardLayoutProps {
  children: ReactNode
}

/**
 * Wizard layout for slide creation
 * 
 * Full-screen with Back (top left) and Next (top right) buttons
 * No dashboard UI elements
 */
export default function SlideWizardLayout({ children }: WizardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Extract current step from pathname
  const currentStep = pathname?.includes('step1') ? 1 
    : pathname?.includes('step2') ? 2 
    : pathname?.includes('step3') ? 3 
    : 1

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="w-full h-full relative flex flex-col">
        {/* Top Navigation Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            {/* Step indicators */}
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full ${
                  step === currentStep
                    ? 'bg-white'
                    : step < currentStep
                    ? 'bg-white/50'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Next button - children control visibility */}
          <div id="wizard-next-button" />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
