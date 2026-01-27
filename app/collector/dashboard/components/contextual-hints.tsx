"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from "@/components/ui"
import { cn } from "@/lib/utils"

interface Hint {
  id: string
  condition: () => boolean
  message: string
  action?: {
    label: string
    href: string
  }
}

interface ContextualHintsProps {
  totalPurchases: number
  daysSinceSignup?: number
  profile?: {
    avatar_url?: string | null
    first_name?: string | null
  } | null
}

export function ContextualHints({ totalPurchases, daysSinceSignup = 0, profile }: ContextualHintsProps) {
  const router = useRouter()
  const [dismissedHints, setDismissedHints] = useState<string[]>([])
  const [currentHint, setCurrentHint] = useState<Hint | null>(null)

  useEffect(() => {
    // Load dismissed hints from localStorage
    const stored = localStorage.getItem("collector_dismissed_hints")
    if (stored) {
      try {
        setDismissedHints(JSON.parse(stored))
      } catch (e) {
        console.error("Error parsing dismissed hints:", e)
      }
    }
  }, [])

  useEffect(() => {
    const hints: Hint[] = [
      {
        id: "first_purchase",
        condition: () => totalPurchases === 0 && daysSinceSignup <= 7,
        message: "Browse the marketplace to find your first artwork",
        action: { label: "Discover", href: "/collector/discover" },
      },
      {
        id: "complete_profile",
        condition: () => !profile?.avatar_url || !profile?.first_name,
        message: "Complete your profile to unlock exclusive benefits",
        action: { label: "Edit Profile", href: "/collector/profile" },
      },
    ]

    // Find the first hint that matches conditions and isn't dismissed
    const activeHint = hints.find(
      (hint) => hint.condition() && !dismissedHints.includes(hint.id)
    )

    setCurrentHint(activeHint || null)
  }, [totalPurchases, daysSinceSignup, profile, dismissedHints])

  const handleDismiss = () => {
    if (!currentHint) return

    const newDismissed = [...dismissedHints, currentHint.id]
    setDismissedHints(newDismissed)
    localStorage.setItem("collector_dismissed_hints", JSON.stringify(newDismissed))
    setCurrentHint(null)
  }

  const handleAction = () => {
    if (!currentHint?.action) return
    router.push(currentHint.action.href)
  }

  if (!currentHint) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Tip</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="mb-3">{currentHint.message}</CardDescription>
          {currentHint.action && (
            <Button size="sm" onClick={handleAction} className="w-full">
              {currentHint.action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
