'use client'

import Link from 'next/link'
import { Button } from '@/components/impact'

interface FixedCTAButtonProps {
  text: string
  href: string
}

/**
 * Fixed CTA button that stays visible as user scrolls.
 * Replaces top nav on street-collector page for focused funnel experience.
 */
export function FixedCTAButton({ text, href }: FixedCTAButtonProps) {
  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto z-50">
      <Link href={href} className="block w-full sm:w-auto">
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto rounded-full px-6 sm:px-8 shadow-lg hover:shadow-xl transition-shadow text-center justify-center"
        >
          {text}
        </Button>
      </Link>
    </div>
  )
}
