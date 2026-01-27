"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Info,
  Save,
  Sparkles,
  ArrowRight,
  Circle,
  CheckCircle2,
  Package,
  Shield,
  Gift,
  Eye,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, Label, Textarea, Alert, AlertDescription, AlertTitle } from "@/components/ui"

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip: () => void
}

interface Step {
  title: string
  description: string
  icon?: React.ReactNode
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const { toast } = useToast()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const stepTimeRef = useRef<number>(Date.now())

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    phone: "",
    avatar_url: "",
  })

  // Define wizard steps
  const steps: Step[] = [
    {
      title: "Welcome",
      description: "Welcome to your collection journey",
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: "Profile Setup",
      description: "Tell us about yourself",
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Meet Your InkOGatchi",
      description: "Your digital avatar companion",
      icon: <Gift className="h-5 w-5" />,
    },
    {
      title: "Discovery",
      description: "Start exploring artworks",
      icon: <Eye className="h-5 w-5" />,
    },
  ]

  // Track step time and send analytics
  useEffect(() => {
    stepTimeRef.current = Date.now()
    return () => {
      const timeSpent = Math.floor((Date.now() - stepTimeRef.current) / 1000)
      if (timeSpent > 0 && currentStep > 0 && currentStep < steps.length) {
        trackStepTime(currentStep, steps[currentStep].title, timeSpent, false)
      }
    }
  }, [currentStep])

  const trackStepTime = async (stepNumber: number, stepName: string, timeSpent: number, completed: boolean) => {
    try {
      await fetch("/api/collector/onboarding/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber,
          stepName,
          timeSpentSeconds: timeSpent,
          completed,
        }),
      })
    } catch (err) {
      console.error("Error tracking step time:", err)
    }
  }

  // Auto-save profile data
  const autoSaveProfile = useCallback(async () => {
    if (currentStep !== 1) return // Only save on profile step

    setAutoSaveStatus("saving")
    try {
      const response = await fetch("/api/collector/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setAutoSaveStatus("saved")
        setTimeout(() => setAutoSaveStatus("idle"), 2000)
      } else {
        setAutoSaveStatus("idle")
      }
    } catch (err) {
      console.error("Error auto-saving profile:", err)
      setAutoSaveStatus("idle")
    }
  }, [formData, currentStep])

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (currentStep === 1 && (formData.first_name || formData.last_name || formData.bio)) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveProfile()
      }, 2000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, autoSaveProfile])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const timeSpent = Math.floor((Date.now() - stepTimeRef.current) / 1000)
      trackStepTime(currentStep, steps[currentStep].title, timeSpent, false)
      
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      setCurrentStep((prev) => prev + 1)
      setStepStartTime(Date.now())
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setStepStartTime(Date.now())
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Track final step
      const timeSpent = Math.floor((Date.now() - stepTimeRef.current) / 1000)
      await trackStepTime(currentStep, steps[currentStep].title, timeSpent, true)

      // Save profile if any data was entered
      if (formData.first_name || formData.last_name || formData.bio) {
        await fetch("/api/collector/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      // Mark onboarding as completed
      const response = await fetch("/api/collector/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to complete onboarding")
      }

      onComplete()
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding")
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    setIsSubmitting(true)
    try {
      // Mark as skipped
      await fetch("/api/collector/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      onSkip()
    } catch (err) {
      console.error("Error skipping onboarding:", err)
      onSkip() // Continue anyway
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => {
                  if (completedSteps.has(index) || index < currentStep) {
                    setCurrentStep(index)
                  }
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : completedSteps.has(index)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                  completedSteps.has(index) || index < currentStep ? "cursor-pointer hover:bg-primary/30" : "cursor-default"
                )}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                <span className="text-xs font-medium truncate hidden sm:inline">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-2", completedSteps.has(index) ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              {steps[currentStep].icon}
              <CardTitle className="text-3xl">{steps[currentStep].title}</CardTitle>
            </div>
            <CardDescription className="text-base">{steps[currentStep].description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Welcome */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Your Collection Journey</h2>
                  <p className="text-muted-foreground mb-8">
                    Join thousands of collectors building their digital art collection
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <Package className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Track Your Collection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Organize and view all your artworks in one place
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Shield className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Authenticate Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Verify physical artworks with NFC scanning
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Gift className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Unlock Rewards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Earn credits and unlock exclusive perks
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <Eye className="h-8 w-8 text-primary mb-2" />
                      <CardTitle>Exclusive Content</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Access hidden series and bonus content
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Step 2: Profile Setup */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Profile Information</Label>
                  {autoSaveStatus === "saving" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </div>
                  )}
                  {autoSaveStatus === "saved" && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Save className="h-3 w-3" />
                      <span>Saved</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This information helps personalize your experience. You can update it anytime.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 3: InkOGatchi */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="inline-block p-6 rounded-full bg-primary/10 mb-4">
                    <Gift className="h-16 w-16 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Meet Your InkOGatchi</h2>
                  <p className="text-muted-foreground mb-6">
                    Your digital avatar that evolves as you collect
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>You Already Have 100 Credits! 🎉</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      As a welcome gift, you've received 100 credits. Use them to customize your InkOGatchi avatar or save them for future purchases.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Rookie Can (Level 1) - Your starting avatar</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Earn credits by purchasing artworks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Evolve through stages: Rookie → Tagger → Artist → Legend</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Discovery */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">Your First Mission</h2>
                  <p className="text-muted-foreground mb-6">
                    Explore our marketplace and discover amazing street art
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Start Collecting?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Browse our curated collection of street art from talented artists around the world. Each purchase earns you credits and brings you closer to unlocking exclusive rewards.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">Browse artworks by artist, series, or price</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">Authenticate physical items with NFC tags</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-primary" />
                        <span className="text-sm">Track your collection and unlock series</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                    Skip to Dashboard
                  </Button>
                  <Button onClick={handleComplete} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Start Exploring
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
