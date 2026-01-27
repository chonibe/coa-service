"use client"

import { useRouter } from "next/navigation"
import { OnboardingWizard } from "../components/onboarding-wizard"

export function WelcomeClient() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/collector/dashboard")
  }

  const handleSkip = () => {
    router.push("/collector/dashboard")
  }

  return (
    <OnboardingWizard 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}
