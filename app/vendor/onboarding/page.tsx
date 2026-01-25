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
    router.push("/vendor/dashboard")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <Card className="p-8 flex flex-col items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-0 shadow-2xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Loading your profile...</p>
        </Card>
      </div>
    )
  }

  return <OnboardingWizard initialData={profileData} onComplete={handleComplete} />
}
