"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { OnboardingWizard } from "../components/onboarding-wizard"
import { captureFunnelEvent, FunnelEvents, setUserProperty } from "@/lib/posthog"
import { getCollectorPageContent } from "@/lib/content/site-content"

interface WelcomeClientProps {
  /** Email from claim token (guest purchaser) */
  claimEmail?: string
  /** Purchase ID from claim token */
  claimPurchaseId?: string
  /** Whether a stub profile already exists */
  profileExists?: boolean
}

const welcomeContent = getCollectorPageContent('welcome')

export function WelcomeClient({ claimEmail, claimPurchaseId, profileExists }: WelcomeClientProps) {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/collector/dashboard")
  }

  const handleSkip = () => {
    router.push("/collector/dashboard")
  }

  // ── Claim flow: user arrived via purchase email link ──
  if (claimEmail) {
    return <ClaimFlow claimEmail={claimEmail} profileExists={profileExists} />
  }

  // ── Standard onboarding flow ──
  return (
    <OnboardingWizard 
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  )
}

function ClaimFlow({ claimEmail, profileExists }: { claimEmail: string; profileExists?: boolean }) {
  useEffect(() => {
    captureFunnelEvent(FunnelEvents.collector_claim_page_viewed, { profile_exists: profileExists ?? false })
    setUserProperty("visited_collector_claim", true)
  }, [profileExists])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-3xl">&#x1F3A8;</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {welcomeContent.claim.title}
        </h1>
        <p className="text-slate-600 mb-2">
          {welcomeContent.claim.sentToPrefix} <strong>{claimEmail}</strong>{welcomeContent.claim.sentToSuffix}
        </p>
        <p className="text-sm text-slate-500 mb-6">
          {welcomeContent.claim.body}
        </p>
        <div className="space-y-3">
          <Link
            href={`/login?redirect=/collector/dashboard&intent=collector`}
            className="block w-full bg-slate-900 text-white rounded-lg py-3 px-6 font-semibold hover:bg-slate-800 transition-colors"
            onClick={() => captureFunnelEvent(FunnelEvents.collector_claim_google_clicked, {})}
          >
            {welcomeContent.claim.primaryCta}
          </Link>
          <Link
            href="/shop"
            className="block w-full text-slate-600 hover:text-slate-900 py-2 text-sm"
            onClick={() => captureFunnelEvent(FunnelEvents.collector_claim_continue_shopping, {})}
          >
            {welcomeContent.claim.secondaryCta}
          </Link>
        </div>
        {profileExists && (
          <p className="text-xs text-emerald-600 mt-4">
            {welcomeContent.claim.profileReady}
          </p>
        )}
      </div>
    </div>
  )
}
