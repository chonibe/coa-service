"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign,
  Image as ImageIcon,
  FileText,
  Eye,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BasicInfoStep } from "./basic-info-step"
import { VariantsStep } from "./variants-step"
import { ImagesStep } from "./images-step"
import { PrintFilesStep } from "./print-files-step"
import { SeriesStep } from "./series-step"
import { ReviewStep } from "./review-step"
import type { ProductSubmissionData, ProductCreationFields } from "@/types/product-submission"

interface ProductWizardProps {
  onComplete: () => void
  onCancel: () => void
  initialData?: ProductSubmissionData
  submissionId?: string // For editing existing submissions
}

interface Step {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

const steps: Step[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Artwork title, description, and type",
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: "variants",
    title: "Variants & Pricing",
    description: "Edition size and pricing",
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    id: "images",
    title: "Images",
    description: "Upload artwork images",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "print-files",
    title: "Print Files",
    description: "Upload PDF files or Google Drive links",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "series",
    title: "Series & Unlocks",
    description: "Assign to series and configure unlock rules",
    icon: <Lock className="h-5 w-5" />,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review your artwork and submit for approval",
    icon: <Eye className="h-5 w-5" />,
  },
]

export function ProductWizard({ onComplete, onCancel, initialData, submissionId }: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldsConfig, setFieldsConfig] = useState<ProductCreationFields | null>(null)
  const [loadingFields, setLoadingFields] = useState(true)
  const [maskSaved, setMaskSaved] = useState(false) // Track if masked artwork image has been saved
  const [showCollectorExperience, setShowCollectorExperience] = useState(false)
  const [skipCollectorExperience, setSkipCollectorExperience] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState<ProductSubmissionData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    product_type: initialData?.product_type || "Art Prints", // Default to Art Prints
    vendor: "",
    handle: initialData?.handle || "",
    tags: [], // Tags will be managed by admin
    variants: initialData?.variants || [
      {
        price: "",
        sku: "",
        requires_shipping: true,
      },
    ],
    images: initialData?.images || [],
    metafields: initialData?.metafields || [], // Edition size will be set in variants step, other metafields managed by admin
  })

  // Fetch field configuration
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch("/api/vendor/products/create/fields", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          setFieldsConfig(data)
          // Set vendor from config or profile
          if (!formData.vendor && data.vendor_collections?.[0]) {
            setFormData((prev) => ({ ...prev, vendor: data.vendor_collections[0].vendor_name }))
          }
        } else {
          setError("Failed to load artwork fields configuration")
        }
      } catch (err) {
        console.error("Error fetching fields:", err)
        setError("Failed to load artwork fields configuration")
      } finally {
        setLoadingFields(false)
      }
    }

    fetchFields()
  }, [])

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic info
        return !!formData.title && formData.title.trim().length > 0
      case 1: // Variants
        return (
          formData.variants.length > 0 &&
          formData.variants.every((v) => v.price && parseFloat(v.price) > 0)
        )
      case 2: // Images
        // If there's an artwork image, mask must be saved before proceeding
        if (formData.images && formData.images.length > 0) {
          return maskSaved
        }
        return true // Images are optional
      case 3: // Print Files
        return true // Print files are optional
      case 4: // Series
        return true // Series is optional
      case 5: // Review
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (!canProceed() || currentStep >= steps.length - 1) return
    setCurrentStep(currentStep + 1)
    setError(null)
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) {
      setError("Please complete all required fields")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // If submissionId exists, update existing submission; otherwise create new
      const url = submissionId
        ? `/api/vendor/products/submissions/${submissionId}`
        : "/api/vendor/products/submit"
      const method = submissionId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_data: formData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors or single error messages
        let errorMessage = data.error || "Failed to submit artwork"
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors.join(", ")
        }
        throw new Error(errorMessage)
      }

      toast({
        title: submissionId ? "Artwork Updated" : "Artwork Submitted",
        description: submissionId
          ? "Your artwork submission has been updated and reset to pending status."
          : "Your artwork has been submitted for admin approval.",
      })

      // If collector experience step was shown and user chose to set up now
      // Note: product_id is only available after publication, so we'll use submission.id
      // and navigate to artwork pages list where they can set up content after approval
      if (showCollectorExperience && !skipCollectorExperience) {
        toast({
          title: "Artwork Submitted",
          description: "After admin approval, you can set up the collector experience in the Artwork Pages section.",
        })
        // Navigate to artwork pages list
        setTimeout(() => {
          window.location.href = `/vendor/dashboard/artwork-pages`
        }, 1500)
        return
      }

      onComplete()
    } catch (err: any) {
      console.error("Error submitting artwork:", err)
      setError(err.message || "Failed to submit artwork")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingFields) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="font-medium">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isClickable = isCompleted
          
          return (
          <div
            key={step.id}
            className={cn(
                "flex flex-col items-center flex-1 min-w-[80px]",
              index < steps.length - 1 && "mr-2",
            )}
          >
              <button
                type="button"
                onClick={() => isClickable && setCurrentStep(index)}
                disabled={!isClickable}
              className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground cursor-pointer hover:scale-110 active:scale-95"
                  : index === currentStep
                      ? "border-primary text-primary cursor-default"
                      : "border-muted text-muted-foreground cursor-default",
              )}
            >
                {isCompleted ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.icon
              )}
              </button>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-xs font-medium",
                  index === currentStep ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.title}
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {/* Error alert */}
      {(error || (currentStep === 2 && formData.images && formData.images.length > 0 && !maskSaved)) && (
        <Alert variant={error ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Please save the masked artwork image before proceeding to the next step."}
          </AlertDescription>
        </Alert>
      )}

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <BasicInfoStep
              formData={formData}
              setFormData={setFormData}
              fieldsConfig={fieldsConfig}
            />
          )}
          {currentStep === 1 && (
            <VariantsStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <ImagesStep 
              formData={formData} 
              setFormData={setFormData}
              onMaskSavedStatusChange={setMaskSaved}
            />
          )}
          {currentStep === 3 && (
            <PrintFilesStep 
              formData={formData} 
              setFormData={setFormData}
            />
          )}
          {currentStep === 4 && (
            <SeriesStep 
              formData={formData} 
              setFormData={setFormData}
            />
          )}
          {currentStep === 5 && (
            <>
              {!showCollectorExperience ? (
                <ReviewStep formData={formData} fieldsConfig={fieldsConfig} />
              ) : (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <h3 className="text-xl font-semibold mb-2">Collector Experience (Optional)</h3>
                    <p className="text-muted-foreground mb-6">
                      Would you like to set up the artwork page collectors will see after authentication?
                    </p>
                    <div className="flex gap-4 justify-center">
                      <Button
                        onClick={() => {
                          // Navigate to artwork pages editor after product is created
                          // For now, we'll skip and let them do it later
                          setSkipCollectorExperience(true)
                          handleSubmit()
                        }}
                        variant="outline"
                      >
                        I'll do this later
                      </Button>
                      <Button
                        onClick={async () => {
                          // Submit product first, then navigate to content editor
                          await handleSubmit()
                          // After successful submission, navigate to artwork pages
                          // This will be handled in the onComplete callback
                          setSkipCollectorExperience(false)
                        }}
                      >
                        Set up now
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          {currentStep === 5 && !showCollectorExperience ? (
            <div className="flex gap-2">
              <Button onClick={() => setShowCollectorExperience(true)} variant="outline">
                Next: Collector Experience (Optional)
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  submissionId ? "Update Submission" : "Submit for Approval"
                )}
              </Button>
            </div>
          ) : currentStep === 5 && showCollectorExperience ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                submissionId ? "Update Submission" : "Submit for Approval"
              )}
            </Button>
          ) : currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isSubmitting}
              title={
                currentStep === 2 && formData.images && formData.images.length > 0 && !maskSaved
                  ? "Please save the masked artwork image before proceeding"
                  : undefined
              }
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}

