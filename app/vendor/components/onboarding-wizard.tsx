"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"








import { Progress } from "@/components/ui/progress"
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
  Clock,
  Sparkles,
  ArrowRight,
  Circle,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Input, Label, Textarea, Checkbox, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription, AlertTitle } from "@/components/ui"
interface OnboardingWizardProps {
  initialData?: any
  onComplete: () => void
}

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Mexico",
  "South Africa",
  "Other",
]

interface Step {
  title: string
  description: string
  fields: string[]
  icon?: React.ReactNode
}

export function OnboardingWizard({ initialData, onComplete }: OnboardingWizardProps) {
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
    vendor_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",
    address: "",
    website: "",
    instagram_url: "",
    bio: "",
    paypal_email: "",
    is_company: false,
    tax_id: "",
    tax_country: "",
    notify_on_sale: true,
    notify_on_payout: true,
    notify_on_message: true,
  })

  // Field validation state (for real-time validation)
  const [fieldValidation, setFieldValidation] = useState<Record<string, { isValid: boolean; error?: string }>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Define wizard steps
  const steps: Step[] = [
    {
      title: "Welcome",
      description: "Let's get started with your vendor profile",
      fields: [],
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: "Basic Information",
      description: "Tell us about yourself",
      fields: ["contact_name", "contact_email", "phone"],
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Business Details",
      description: "Share your business information",
      fields: ["address", "website", "instagram_url", "bio"],
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Payment Information",
      description: "Setup your PayPal payouts",
      fields: ["paypal_email"],
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Tax Information",
      description: "Required for tax compliance",
      fields: ["is_company", "tax_id", "tax_country"],
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Notification Preferences",
      description: "Choose how you want to be notified",
      fields: ["notify_on_sale", "notify_on_payout", "notify_on_message"],
      icon: <Circle className="h-5 w-5" />,
    },
    {
      title: "Complete",
      description: "Your profile is now set up",
      fields: [],
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
  ]

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch("/api/vendor/onboarding/progress", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          if (data.formData) {
            setFormData((prev) => ({ ...prev, ...data.formData }))
          }
          if (data.step !== undefined && data.step > 0) {
            setCurrentStep(data.step)
            // Mark previous steps as completed
            const completed = new Set<number>()
            for (let i = 0; i < data.step; i++) {
              completed.add(i)
            }
            setCompletedSteps(completed)
          }
        }
      } catch (err) {
        console.error("Error loading progress:", err)
      }
    }

    // Also load from initialData
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        vendor_name: initialData.vendor_name || "",
        contact_name: initialData.contact_name || "",
        contact_email: initialData.contact_email || "",
        phone: initialData.phone || "",
        address: initialData.address || "",
        website: initialData.website || "",
        instagram_url: initialData.instagram_url || "",
        bio: initialData.bio || "",
        paypal_email: initialData.paypal_email || "",
        is_company: initialData.is_company || false,
        tax_id: initialData.tax_id || "",
        tax_country: initialData.tax_country || "",
        notify_on_sale: initialData.notify_on_sale !== undefined ? initialData.notify_on_sale : true,
        notify_on_payout: initialData.notify_on_payout !== undefined ? initialData.notify_on_payout : true,
        notify_on_message: initialData.notify_on_message !== undefined ? initialData.notify_on_message : true,
      }))
    }

    loadProgress()
  }, [initialData])

  // Track step time
  useEffect(() => {
    stepTimeRef.current = Date.now()
    return () => {
      const timeSpent = Math.floor((Date.now() - stepTimeRef.current) / 1000)
      if (timeSpent > 0 && currentStep > 0 && currentStep < steps.length - 1) {
        // Track analytics
        fetch("/api/vendor/onboarding/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            stepNumber: currentStep,
            stepName: steps[currentStep].title,
            timeSpentSeconds: timeSpent,
            completed: completedSteps.has(currentStep),
          }),
        }).catch(console.error)
      }
    }
  }, [currentStep])

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (currentStep === 0 || currentStep === steps.length - 1) return

    setAutoSaveStatus("saving")
    try {
      const response = await fetch("/api/vendor/onboarding/auto-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          formData,
          currentStep,
        }),
      })

      if (response.ok) {
        setAutoSaveStatus("saved")
        setTimeout(() => setAutoSaveStatus("idle"), 2000)
      } else {
        setAutoSaveStatus("idle")
      }
    } catch (err) {
      console.error("Auto-save error:", err)
      setAutoSaveStatus("idle")
    }
  }, [formData, currentStep])

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    if (currentStep > 0 && currentStep < steps.length - 1) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave()
      }, 2000)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, currentStep, autoSave])

  // Real-time field validation
  const validateField = useCallback((name: string, value: any): { isValid: boolean; error?: string } => {
    switch (name) {
      case "contact_name":
        if (!value?.trim()) return { isValid: false, error: "Contact name is required" }
        return { isValid: true }
      case "contact_email":
        if (!value?.trim()) return { isValid: false, error: "Contact email is required" }
        if (!/\S+@\S+\.\S+/.test(value)) return { isValid: false, error: "Please enter a valid email address" }
        return { isValid: true }
      case "phone":
        if (!value?.trim()) return { isValid: false, error: "Phone number is required" }
        return { isValid: true }
      case "address":
        if (!value?.trim()) return { isValid: false, error: "Business address is required" }
        return { isValid: true }
        if (!value?.trim()) {
          return { isValid: false, error: "PayPal email is required for payouts" }
        }
        if (value?.trim() && !/\S+@\S+\.\S+/.test(value)) {
          return { isValid: false, error: "Please enter a valid email address" }
        }
        return { isValid: true }
      case "tax_id":
        if (!value?.trim()) return { isValid: false, error: "Tax ID is required" }
        return { isValid: true }
      case "tax_country":
        if (!value) return { isValid: false, error: "Tax country is required" }
        return { isValid: true }
      case "website":
        if (value?.trim() && !/^https?:\/\/.+/.test(value)) {
          return { isValid: false, error: "Please enter a valid URL (starting with http:// or https://)" }
        }
        return { isValid: true }
      case "instagram_url":
        if (value?.trim() && !/^https?:\/\/.+/.test(value)) {
          return { isValid: false, error: "Please enter a valid URL (starting with http:// or https://)" }
        }
        return { isValid: true }
      default:
        return { isValid: true }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    const validation = validateField(name, value)
    setFieldValidation((prev) => ({ ...prev, [name]: validation }))

    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Real-time validation
    const validation = validateField(name, value)
    setFieldValidation((prev) => ({ ...prev, [name]: validation }))

    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const validateStep = () => {
    const currentFields = steps[currentStep].fields
    const errors: Record<string, string> = {}

    if (currentStep === 0 || currentStep === steps.length - 1) {
      return true
    }

    currentFields.forEach((field) => {
      const validation = validateField(field, formData[field as keyof typeof formData])
      if (!validation.isValid && validation.error) {
        errors[field] = validation.error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]))
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // Allow navigation to completed steps or next step
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/vendor/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      // Mark onboarding as complete
      await fetch("/api/vendor/onboarding/complete", {
        method: "POST",
        credentials: "include",
      })

      setCurrentStep(steps.length - 1)
      setCompletedSteps((prev) => new Set([...prev, currentStep]))

      toast({
        title: "Profile updated",
        description: "Your vendor profile has been successfully updated.",
      })
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update profile",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPercentage = (currentStep / (steps.length - 1)) * 100

  // Step Indicator Component
  const StepIndicator = () => {
    return (
      <div className="w-full mb-6">
        {/* Desktop: Full step indicator */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index)
              const isCurrent = index === currentStep
              const isAccessible = index <= currentStep || completedSteps.has(index)

              return (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <button
                      onClick={() => handleStepClick(index)}
                      disabled={!isAccessible}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                        isCompleted && "bg-green-500 border-green-500 text-white",
                        isCurrent && !isCompleted && "bg-primary border-primary text-white",
                        !isCurrent && !isCompleted && isAccessible && "bg-gray-100 border-gray-300 text-gray-600",
                        !isAccessible && "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed",
                        isAccessible && "hover:scale-110 cursor-pointer"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </button>
                    <div className="mt-2 text-center max-w-[100px]">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          isCurrent && "text-primary",
                          !isCurrent && "text-gray-500"
                        )}
                      >
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2",
                        isCompleted ? "bg-green-500" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: Horizontal scrollable indicator */}
        <div className="md:hidden overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-max px-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index)
              const isCurrent = index === currentStep

              return (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[80px]",
                    isCurrent && "bg-primary/10"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                      isCompleted && "bg-green-500 text-white",
                      isCurrent && !isCompleted && "bg-primary text-white",
                      !isCurrent && !isCompleted && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="text-xs font-medium text-center">{step.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>
    )
  }

  // Auto-save indicator
  const AutoSaveIndicator = () => {
    if (currentStep === 0 || currentStep === steps.length - 1) return null

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        {autoSaveStatus === "saving" && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        )}
        {autoSaveStatus === "saved" && (
          <>
            <Save className="h-4 w-4 text-green-500" />
            <span className="text-green-500">Saved</span>
          </>
        )}
        {autoSaveStatus === "idle" && (
          <>
            <Clock className="h-4 w-4" />
            <span>Auto-saving...</span>
          </>
        )}
      </div>
    )
  }

  // Field with validation and tooltip
  const FormField = ({
    label,
    name,
    required,
    children,
    tooltip,
    hint,
  }: {
    label: string
    name: string
    required?: boolean
    children: React.ReactNode
    tooltip?: string
    hint?: string
  }) => {
    const validation = fieldValidation[name]
    const hasError = validationErrors[name] || (validation && !validation.isValid)

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={name} className={cn(hasError && "text-red-500")}>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {validation?.isValid && !hasError && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
        {children}
        {hint && !hasError && <p className="text-sm text-gray-500">{hint}</p>}
        {hasError && (
          <p className="text-sm text-red-500">
            {validationErrors[name] || validation?.error}
          </p>
        )}
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome step
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-16 w-16 text-primary" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome to the Vendor Portal!</h3>
              <p className="text-gray-600 text-lg">
                Let's set up your vendor profile in just a few minutes
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-3 text-left">What you'll need:</h4>
              <ul className="list-disc pl-5 text-blue-800 space-y-2 text-left">
                <li>Your contact information</li>
                <li>Business address</li>
                <li>PayPal email for payouts</li>
                <li>Tax identification information</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Estimated time: 5-7 minutes</span>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-900 mb-2">Benefits of completing:</h4>
              <ul className="list-disc pl-5 text-green-800 space-y-1 text-left text-sm">
                <li>Receive payments faster</li>
                <li>Stay tax compliant</li>
                <li>Get important notifications</li>
                <li>Access all vendor features</li>
              </ul>
            </div>
          </div>
        )

      case 1: // Basic Information
        return (
          <div className="space-y-6">
            <FormField
              label="Contact Name"
              name="contact_name"
              required
              tooltip="This is the name we'll use to contact you about your vendor account"
            >
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="John Doe"
                value={formData.contact_name}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("contact_name", formData.contact_name)
                  setFieldValidation((prev) => ({ ...prev, contact_name: validation }))
                }}
                className={cn(
                  validationErrors.contact_name || (fieldValidation.contact_name && !fieldValidation.contact_name.isValid)
                    ? "border-red-500"
                    : fieldValidation.contact_name?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>

            <FormField
              label="Contact Email"
              name="contact_email"
              required
              tooltip="We'll send important notifications and updates to this email address"
              hint="This will be used for account communications"
            >
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.contact_email}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("contact_email", formData.contact_email)
                  setFieldValidation((prev) => ({ ...prev, contact_email: validation }))
                }}
                className={cn(
                  validationErrors.contact_email || (fieldValidation.contact_email && !fieldValidation.contact_email.isValid)
                    ? "border-red-500"
                    : fieldValidation.contact_email?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>

            <FormField
              label="Phone Number"
              name="phone"
              required
              tooltip="We may need to contact you by phone for urgent matters"
            >
              <Input
                id="phone"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("phone", formData.phone)
                  setFieldValidation((prev) => ({ ...prev, phone: validation }))
                }}
                className={cn(
                  validationErrors.phone || (fieldValidation.phone && !fieldValidation.phone.isValid)
                    ? "border-red-500"
                    : fieldValidation.phone?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>
          </div>
        )

      case 2: // Business Details
        return (
          <div className="space-y-6">
            <FormField
              label="Business Address"
              name="address"
              required
              tooltip="Required for tax reporting and compliance purposes"
              hint="This will be used for tax reporting"
            >
              <Textarea
                id="address"
                name="address"
                placeholder="123 Main Street, City, State, ZIP Code"
                value={formData.address}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("address", formData.address)
                  setFieldValidation((prev) => ({ ...prev, address: validation }))
                }}
                className={cn(
                  validationErrors.address || (fieldValidation.address && !fieldValidation.address.isValid)
                    ? "border-red-500"
                    : fieldValidation.address?.isValid
                    ? "border-green-500"
                    : ""
                )}
                rows={3}
              />
            </FormField>

            <FormField
              label="Website"
              name="website"
              tooltip="Your business website URL (optional)"
              hint="Include http:// or https://"
            >
              <Input
                id="website"
                name="website"
                placeholder="https://www.yourwebsite.com"
                value={formData.website}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("website", formData.website)
                  setFieldValidation((prev) => ({ ...prev, website: validation }))
                }}
                className={cn(
                  fieldValidation.website && !fieldValidation.website.isValid
                    ? "border-red-500"
                    : fieldValidation.website?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>

            <FormField
              label="Instagram URL"
              name="instagram_url"
              tooltip="Your Instagram profile URL (optional)"
              hint="Include http:// or https://"
            >
              <Input
                id="instagram_url"
                name="instagram_url"
                placeholder="https://instagram.com/yourusername"
                value={formData.instagram_url}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("instagram_url", formData.instagram_url)
                  setFieldValidation((prev) => ({ ...prev, instagram_url: validation }))
                }}
                className={cn(
                  fieldValidation.instagram_url && !fieldValidation.instagram_url.isValid
                    ? "border-red-500"
                    : fieldValidation.instagram_url?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>

            <FormField
              label="Bio / About Your Business"
              name="bio"
              tooltip="Tell us about your business and what you create (optional)"
            >
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself and your work..."
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {formData.bio.length}/500 characters
              </p>
            </FormField>
          </div>
        )

      case 3: // Payment Information
        return (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                All vendor payouts are processed via PayPal. Please provide your PayPal email address below.
              </AlertDescription>
            </Alert>

            <FormField
              label="PayPal Email"
              name="paypal_email"
              required
              tooltip="We use PayPal for all vendor payouts. This is required to receive your earnings."
              hint="Your payouts will be sent to this email address"
            >
              <Input
                id="paypal_email"
                name="paypal_email"
                type="email"
                placeholder="paypal@example.com"
                value={formData.paypal_email}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("paypal_email", formData.paypal_email)
                  setFieldValidation((prev) => ({ ...prev, paypal_email: validation }))
                }}
                className={cn(
                  validationErrors.paypal_email || (fieldValidation.paypal_email && !fieldValidation.paypal_email.isValid)
                    ? "border-red-500"
                    : fieldValidation.paypal_email?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>
          </div>
        )

      case 4: // Tax Information
        return (
          <div className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Tax information is required for compliance with tax regulations. This information will be used for tax
                reporting purposes.
              </AlertDescription>
            </Alert>

            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="is_company"
                checked={formData.is_company}
                onCheckedChange={(checked) => handleCheckboxChange("is_company", checked === true)}
              />
              <label
                htmlFor="is_company"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                I am registering as a business/company (not an individual)
              </label>
            </div>

            <FormField
              label={formData.is_company ? "Business Tax ID / VAT Number" : "Tax ID / SSN / National Insurance Number"}
              name="tax_id"
              required
              tooltip="Required for tax reporting. This information is kept secure and only used for compliance purposes."
              hint="This will be used for tax reporting"
            >
              <Input
                id="tax_id"
                name="tax_id"
                placeholder={formData.is_company ? "e.g. 123456789" : "e.g. XXX-XX-XXXX"}
                value={formData.tax_id}
                onChange={handleInputChange}
                onBlur={() => {
                  const validation = validateField("tax_id", formData.tax_id)
                  setFieldValidation((prev) => ({ ...prev, tax_id: validation }))
                }}
                className={cn(
                  validationErrors.tax_id || (fieldValidation.tax_id && !fieldValidation.tax_id.isValid)
                    ? "border-red-500"
                    : fieldValidation.tax_id?.isValid
                    ? "border-green-500"
                    : ""
                )}
              />
            </FormField>

            <FormField
              label="Tax Residence Country"
              name="tax_country"
              required
              tooltip="The country where you are tax resident. This determines tax reporting requirements."
            >
              <Select
                value={formData.tax_country}
                onValueChange={(value) => handleSelectChange("tax_country", value)}
              >
                <SelectTrigger
                  id="tax_country"
                  className={cn(
                    validationErrors.tax_country || (fieldValidation.tax_country && !fieldValidation.tax_country.isValid)
                      ? "border-red-500"
                      : fieldValidation.tax_country?.isValid
                      ? "border-green-500"
                      : ""
                  )}
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Tax Information</AlertTitle>
              <AlertDescription>
                <p className="text-sm mt-2">
                  We are required to collect tax information for all vendors. This information will be used for tax
                  reporting purposes and may be shared with tax authorities.
                </p>
                <p className="text-sm mt-2">
                  For US vendors: We will issue a 1099 form if your earnings exceed $600 in a calendar year.
                </p>
                <p className="text-sm mt-2">
                  For non-US vendors: We may be required to withhold taxes based on tax treaties between your country
                  and the United States.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )

      case 5: // Notification Preferences
        return (
          <div className="space-y-6">
            <p className="text-gray-600">
              Choose how you want to be notified about important events related to your vendor account.
            </p>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="notify_on_sale"
                  checked={formData.notify_on_sale}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_sale", checked === true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="notify_on_sale"
                    className="text-sm font-medium leading-none cursor-pointer block mb-1"
                  >
                    Sales Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications when your products are sold</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="notify_on_payout"
                  checked={formData.notify_on_payout}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_payout", checked === true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="notify_on_payout"
                    className="text-sm font-medium leading-none cursor-pointer block mb-1"
                  >
                    Payout Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications when payouts are processed</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="notify_on_message"
                  checked={formData.notify_on_message}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_message", checked === true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="notify_on_message"
                    className="text-sm font-medium leading-none cursor-pointer block mb-1"
                  >
                    Message Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications when you receive new messages</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 6: // Complete
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-5 w-5 text-yellow-900" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-2">Profile Setup Complete! 🎉</h3>
              <p className="text-gray-600 text-lg">
              Thank you for completing your vendor profile. You're now ready to start selling your products.
            </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">What's Next:</h4>
              <ul className="list-disc pl-5 text-green-800 space-y-2 text-left">
                <li>Explore your vendor dashboard</li>
                <li>Check your product listings</li>
                <li>Review your payment settings</li>
                <li>Start uploading your products</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={onComplete} size="lg" className="gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => window.location.href = "/vendor/dashboard/settings"}>
                Review Settings
            </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 md:p-8">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <TooltipProvider>
        <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl relative z-10">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
          
          {/* Glow effect */}
          <div className="absolute -top-1 -right-1 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
          
          <CardHeader className="border-b border-slate-200/50 dark:border-slate-800/50 relative z-10">
            <StepIndicator />
            <AutoSaveIndicator />
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription className="mt-1">{steps[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 relative z-10">
            {error && (
              <Alert variant="destructive" className="mb-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-200/50 dark:border-slate-800/50 pt-6 relative z-10">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || currentStep === steps.length - 1}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep < steps.length - 2 ? (
              <Button 
                onClick={handleNext} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : currentStep === steps.length - 2 ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Complete <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </TooltipProvider>
    </div>
  )
}
