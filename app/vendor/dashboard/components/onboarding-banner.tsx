"use client"

import { useState } from "react"


import { ArrowRight, X } from "lucide-react"
import Link from "next/link"

import { Button, Card, CardContent } from "@/components/ui"
interface OnboardingBannerProps {
  vendorName: string
}

export function OnboardingBanner({ vendorName }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 mb-6">
      <CardContent className="p-6">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-blue-900">Welcome, {vendorName}!</h3>
            <p className="text-blue-700 mt-1">
              Complete your vendor profile setup to ensure you can receive payments and comply with tax regulations.
            </p>
          </div>

          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/vendor/onboarding" className="flex items-center">
              Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
