"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react"

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

export function OnboardingWizard({ initialData, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    // Basic info
    vendor_name: "",
    contact_name: "",
    contact_email: "",
    phone: "",

    // Business details
    address: "",
    website: "",
    instagram_url: "",
    bio: "",

    // Payment info
    paypal_email: "",
    bank_account: "",

    // Tax info
    is_company: false,
    tax_id: "",
    tax_country: "",

    // Notification preferences
    notify_on_sale: true,
    notify_on_payout: true,
    notify_on_message: true,
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize form data from props
  useEffect(() => {
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
        bank_account: initialData.bank_account || "",
        is_company: initialData.is_company || false,
        tax_id: initialData.tax_id || "",
        tax_country: initialData.tax_country || "",
        notify_on_sale: initialData.notify_on_sale !== undefined ? initialData.notify_on_sale : true,
        notify_on_payout: initialData.notify_on_payout !== undefined ? initialData.notify_on_payout : true,
        notify_on_message: initialData.notify_on_message !== undefined ? initialData.notify_on_message : true,
      }))
    }
  }, [initialData])

  // Define wizard steps
  const steps = [
    {
      title: "Welcome",
      description: "Let's get started with your artist profile",
      fields: [],
    },
    {
      title: "Basic Information",
      description: "Tell us about yourself",
      fields: ["contact_name", "contact_email", "phone"],
    },
    {
      title: "Business Details",
      description: "Share your business information",
      fields: ["address", "website", "instagram_url", "bio"],
    },
    {
      title: "Payment Information",
      description: "How would you like to get paid",
      fields: ["paypal_email", "bank_account"],
    },
    {
      title: "Tax Information",
      description: "Required for tax compliance",
      fields: ["is_company", "tax_id", "tax_country"],
    },
    {
      title: "Notification Preferences",
      description: "Choose how you want to be notified",
      fields: ["notify_on_sale", "notify_on_payout", "notify_on_message"],
    },
    {
      title: "Complete",
      description: "Your profile is now set up",
      fields: [],
    },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear validation error when field is edited
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

    // Clear validation error when field is edited
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

    // Skip validation for welcome and complete steps
    if (currentStep === 0 || currentStep === steps.length - 1) {
      return true
    }

    // Validate required fields based on the current step
    currentFields.forEach((field) => {
      switch (field) {
        case "contact_name":
          if (!formData.contact_name.trim()) {
            errors.contact_name = "Contact name is required"
          }
          break
        case "contact_email":
          if (!formData.contact_email.trim()) {
            errors.contact_email = "Contact email is required"
          } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
            errors.contact_email = "Please enter a valid email address"
          }
          break
        case "phone":
          if (!formData.phone.trim()) {
            errors.phone = "Phone number is required"
          }
          break
        case "address":
          if (!formData.address.trim()) {
            errors.address = "Business address is required"
          }
          break
        case "paypal_email":
          // Only validate if bank_account is empty
          if (!formData.paypal_email.trim() && !formData.bank_account.trim()) {
            errors.paypal_email = "Either PayPal email or bank account is required"
          } else if (formData.paypal_email.trim() && !/\S+@\S+\.\S+/.test(formData.paypal_email)) {
            errors.paypal_email = "Please enter a valid email address"
          }
          break
        case "tax_id":
          if (!formData.tax_id.trim()) {
            errors.tax_id = "Tax ID is required"
          }
          break
        case "tax_country":
          if (!formData.tax_country) {
            errors.tax_country = "Tax country is required"
          }
          break
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
        window.scrollTo(0, 0)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch("/api/vendor/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      // Move to completion step
      setCurrentStep(steps.length - 1)

      toast({
        title: "Profile updated",
        description: "Your artist profile has been successfully updated.",
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome step
        return (
          <div className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h3 className="text-xl font-medium text-center">Welcome to the Artist Portal!</h3>

            <p className="text-center text-gray-600">
              This wizard will guide you through setting up your artist profile. Complete all steps to ensure you can
              receive payments and comply with tax regulations.
            </p>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">What you'll need:</h4>
              <ul className="list-disc pl-5 text-blue-700 space-y-1">
                <li>Your contact information</li>
                <li>Business address</li>
                <li>Payment details (PayPal or bank account)</li>
                <li>Tax identification information</li>
              </ul>
            </div>

            <p className="text-center text-gray-600 mt-4">Let's get started by clicking the "Next" button below.</p>
          </div>
        )

      case 1: // Basic Information
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">
                Contact Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_name"
                name="contact_name"
                placeholder="Full Name"
                value={formData.contact_name}
                onChange={handleInputChange}
                className={validationErrors.contact_name ? "border-red-500" : ""}
              />
              {validationErrors.contact_name && <p className="text-sm text-red-500">{validationErrors.contact_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">
                Contact Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="email@example.com"
                value={formData.contact_email}
                onChange={handleInputChange}
                className={validationErrors.contact_email ? "border-red-500" : ""}
              />
              {validationErrors.contact_email && (
                <p className="text-sm text-red-500">{validationErrors.contact_email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleInputChange}
                className={validationErrors.phone ? "border-red-500" : ""}
              />
              {validationErrors.phone && <p className="text-sm text-red-500">{validationErrors.phone}</p>}
            </div>
          </div>
        )

      case 2: // Business Details
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">
                Business Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                name="address"
                placeholder="Enter your full business address"
                value={formData.address}
                onChange={handleInputChange}
                className={validationErrors.address ? "border-red-500" : ""}
                rows={3}
              />
              {validationErrors.address && <p className="text-sm text-red-500">{validationErrors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                name="website"
                placeholder="https://www.yourwebsite.com"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram URL (Optional)</Label>
              <Input
                id="instagram_url"
                name="instagram_url"
                placeholder="https://instagram.com/yourusername"
                value={formData.instagram_url}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / About Your Business (Optional)</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself and your work..."
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        )

      case 3: // Payment Information
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-100 mb-4">
              <p className="text-amber-800">
                You must provide either a PayPal email or bank account details to receive payments.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paypal_email">PayPal Email (Recommended)</Label>
              <Input
                id="paypal_email"
                name="paypal_email"
                type="email"
                placeholder="paypal@example.com"
                value={formData.paypal_email}
                onChange={handleInputChange}
                className={validationErrors.paypal_email ? "border-red-500" : ""}
              />
              {validationErrors.paypal_email && <p className="text-sm text-red-500">{validationErrors.paypal_email}</p>}
              <p className="text-sm text-gray-500">
                We primarily use PayPal for vendor payments. This is the fastest way to receive your funds.
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">OR</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account">Bank Account Details (Alternative)</Label>
              <Textarea
                id="bank_account"
                name="bank_account"
                placeholder="Bank name, Account number, Sort code/Routing number, etc."
                value={formData.bank_account}
                onChange={handleInputChange}
                rows={3}
              />
              <p className="text-sm text-gray-500">
                Only provide bank details if you cannot use PayPal. Additional verification may be required.
              </p>
            </div>
          </div>
        )

      case 4: // Tax Information
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
              <p className="text-blue-800">
                Tax information is required for compliance with tax regulations. This information will be used for tax
                reporting purposes.
              </p>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="is_company"
                checked={formData.is_company}
                onCheckedChange={(checked) => handleCheckboxChange("is_company", checked === true)}
              />
              <label
                htmlFor="is_company"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I am registering as a business/company (not an individual)
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">
                {formData.is_company ? "Business Tax ID / VAT Number" : "Tax ID / SSN / National Insurance Number"}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tax_id"
                name="tax_id"
                placeholder={formData.is_company ? "e.g. 123456789" : "e.g. XXX-XX-XXXX"}
                value={formData.tax_id}
                onChange={handleInputChange}
                className={validationErrors.tax_id ? "border-red-500" : ""}
              />
              {validationErrors.tax_id && <p className="text-sm text-red-500">{validationErrors.tax_id}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_country">
                Tax Residence Country <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.tax_country} onValueChange={(value) => handleSelectChange("tax_country", value)}>
                <SelectTrigger id="tax_country" className={validationErrors.tax_country ? "border-red-500" : ""}>
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
              {validationErrors.tax_country && <p className="text-sm text-red-500">{validationErrors.tax_country}</p>}
            </div>

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
              Choose how you want to be notified about important events related to your artist account.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_sale"
                  checked={formData.notify_on_sale}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_sale", checked === true)}
                />
                <div className="grid gap-1.5">
                  <label
                    htmlFor="notify_on_sale"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sales Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications when your products are sold</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_payout"
                  checked={formData.notify_on_payout}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_payout", checked === true)}
                />
                <div className="grid gap-1.5">
                  <label
                    htmlFor="notify_on_payout"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Payout Notifications
                  </label>
                  <p className="text-sm text-gray-500">Receive notifications when payouts are processed</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify_on_message"
                  checked={formData.notify_on_message}
                  onCheckedChange={(checked) => handleCheckboxChange("notify_on_message", checked === true)}
                />
                <div className="grid gap-1.5">
                  <label
                    htmlFor="notify_on_message"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
          <div className="space-y-4 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>

            <h3 className="text-xl font-medium">Profile Setup Complete!</h3>

            <p className="text-gray-600">
              Thank you for completing your artist profile. You're now ready to start selling your products.
            </p>

            <div className="bg-green-50 p-4 rounded-md border border-green-100 mt-4">
              <h4 className="font-medium text-green-800 mb-2">What's Next:</h4>
              <ul className="list-disc pl-5 text-green-700 space-y-1">
                <li>Explore your artist dashboard</li>
                <li>Check your product listings</li>
                <li>Review your payment settings</li>
                <li>Set up your tax information</li>
              </ul>
            </div>

            <Button onClick={onComplete} className="mt-6">
              Go to Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1">
        <div
          className="bg-primary h-1 transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>

      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {renderStepContent()}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || currentStep === steps.length - 1}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {currentStep < steps.length - 2 ? (
          <Button onClick={handleNext}>
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : currentStep === steps.length - 2 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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
  )
}
