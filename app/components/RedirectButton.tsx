'use client'

import { Button } from "@/components/ui/button"

export function RedirectButton() {
  return (
    <Button
      onClick={() => window.location.href = 'https://www.thestreetlamp.com/pages/authenticate'}
      className="w-full md:w-auto"
    >
      Go to My Account
    </Button>
  )
} 