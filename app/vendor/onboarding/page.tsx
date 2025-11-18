"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { OnboardingWizard } from "../components/onboarding-wizard"

export default function VendorOnboardingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const response = await fetch("/api/vendor/profile", {
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch vendor profile")
        }

        const data = await response.json()
        setProfileData(data.vendor)
      } catch (error) {
        console.error("Error fetching vendor profile:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your profile. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVendorProfile()
  }, [router, toast])

  const handleComplete = () => {
    toast({
      title: "Profile completed!",
      description: "Your vendor profile has been successfully set up.",
    })
    router.push("/vendor/dashboard")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="p-8 flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading your profile...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome to the Vendor Portal</h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's set up your profile to get you started with selling your products
          </p>
        </div>

        <OnboardingWizard initialData={profileData} onComplete={handleComplete} />
      </div>
    </div>
  )
}
