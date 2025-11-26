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
  Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BasicInfoStep } from "./basic-info-step"
import { VariantsStep } from "./variants-step"
import { ImagesStep } from "./images-step"
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
    description: "Product title, description, and type",
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
    description: "Upload product images",
    icon: <ImageIcon className="h-5 w-5" />,
  },
  {
    id: "review",
    title: "Review & Submit",
    description: "Review your product and submit for approval",
    icon: <Eye className="h-5 w-5" />,
  },
]

export function ProductWizard({ onComplete, onCancel, initialData, submissionId }: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldsConfig, setFieldsConfig] = useState<ProductCreationFields | null>(null)
  const [loadingFields, setLoadingFields] = useState(true)
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
          setError("Failed to load product fields configuration")
        }
      } catch (err) {
        console.error("Error fetching fields:", err)
        setError("Failed to load product fields configuration")
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
        return true // Images are optional
      case 3: // Review
        return true
      default:
        return false
    }
  }

  const [applyMaskFn, setApplyMaskFn] = useState<(() => Promise<void>) | null>(null)

  const handleNext = async () => {
    if (!canProceed() || currentStep >= steps.length - 1) return
    
    // If we're on the images step (step 2), generate the masked image ONLY when moving to review step
    // This prevents any mask generation during preview which could cause performance issues
    if (currentStep === 2 && applyMaskFn) {
      try {
        setIsSubmitting(true) // Show loading state
        setError(null)
        await applyMaskFn()
        setIsSubmitting(false)
        // Mask generation successful, proceed to next step
      } catch (error) {
        console.error("Error generating masked image:", error)
        setIsSubmitting(false)
        setError("Failed to generate masked image. Please try adjusting the image position.")
        return // Don't proceed if mask generation fails
      }
    }
    
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
        let errorMessage = data.error || "Failed to submit product"
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors.join(", ")
        }
        throw new Error(errorMessage)
      }

      toast({
        title: submissionId ? "Product Updated" : "Product Submitted",
        description: submissionId
          ? "Your product submission has been updated and reset to pending status."
          : "Your product has been submitted for admin approval.",
      })

      onComplete()
    } catch (err: any) {
      console.error("Error submitting product:", err)
      setError(err.message || "Failed to submit product")
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
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex flex-col items-center flex-1",
              index < steps.length - 1 && "mr-2",
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                    ? "border-primary text-primary"
                    : "border-muted text-muted-foreground",
              )}
            >
              {index < currentStep ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                step.icon
              )}
            </div>
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
        ))}
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
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
              onMaskReady={setApplyMaskFn}
            />
          )}
          {currentStep === 3 && (
            <ReviewStep formData={formData} fieldsConfig={fieldsConfig} />
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancel" : "Back"}
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isSubmitting}
            >
              {isSubmitting && currentStep === 2 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Mask...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
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
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

