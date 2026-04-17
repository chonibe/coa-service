"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { OnboardingWizard } from "../components/onboarding-wizard"

import { Card } from "@/components/ui"
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
    router.push("/vendor/home")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#1a1a1a]/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="font-body text-sm">Loading your profile…</p>
        </div>
      </div>
    )
  }

  return <OnboardingWizard initialData={profileData} onComplete={handleComplete} />
}
