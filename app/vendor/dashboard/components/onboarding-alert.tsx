"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ChevronRight } from "lucide-react"
import Link from "next/link"

interface ArtistProfile {
  vendor_name: string
  paypal_email: string | null
  tax_id: string | null
  tax_country: string | null
  is_company: boolean
  bank_account: string | null
  address: string | null
  phone: string | null
}

export function OnboardingAlert() {
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile")
        if (response.ok) {
          const data = await response.json()
          setProfile(data.vendor)

          // Calculate completion percentage
          calculateCompletionPercentage(data.vendor)
        }
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Check if the alert was dismissed in the last 24 hours
    const lastDismissed = localStorage.getItem("onboardingAlertDismissed")
    if (lastDismissed) {
      const dismissedTime = Number.parseInt(lastDismissed, 10)
      const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000
      if (dismissedTime > twentyFourHoursAgo) {
        setDismissed(true)
      }
    }

    fetchProfile()
  }, [])

  const calculateCompletionPercentage = (vendor: ArtistProfile) => {
    if (!vendor) return 0

    const requiredFields = [
      !!vendor.paypal_email,
      !!vendor.tax_id,
      !!vendor.tax_country,
      !!vendor.address,
      !!vendor.phone,
    ]

    const completedFields = requiredFields.filter(Boolean).length
    const percentage = Math.round((completedFields / requiredFields.length) * 100)
    setCompletionPercentage(percentage)
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem("onboardingAlertDismissed", Date.now().toString())
  }

  if (isLoading || dismissed || (profile && completionPercentage === 100)) {
    return null
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <AlertTitle className="text-amber-800">Complete your artist profile</AlertTitle>
        <AlertDescription className="text-amber-700">
          <div className="mt-2 mb-3">
            <div className="flex justify-between mb-1 text-sm">
              <span>Profile completion</span>
              <span>{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
          <p className="mb-3">
            Please complete your profile to ensure timely payouts and tax compliance. Missing information may delay your
            payments.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button asChild variant="default" size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/vendor/dashboard/settings">
                Complete Profile <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            >
              Remind me later
            </Button>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  )
}
